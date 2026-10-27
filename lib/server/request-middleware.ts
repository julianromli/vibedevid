import { type CookieSerializeOptions, serialize } from "cookie-es";
import { eq } from "drizzle-orm";
import { type Locale, routing } from "@/i18n";
import { getSafeRedirectPath } from "@/lib/auth/redirect-path";
import { getAuth } from "@/lib/auth/server";
import { AUTH_PATH, ONBOARDING_PATH, resolveOnboardingRedirect } from "@/lib/auth/onboarding-gate";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from "@/lib/locale";
import { canonicalHostRedirectResponse } from "@/lib/seo/site-url";

type CookieRecord = { name: string; value: string; options?: CookieSerializeOptions };

function parseRequestCookies(request: Request): CookieRecord[] {
  const header = request.headers.get("cookie");
  if (!header) return [];

  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const separator = trimmed.indexOf("=");
    if (separator === -1) return [];
    const name = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);
    return [{ name, value: decodeURIComponent(value) }];
  });
}

function getCookieValue(request: Request, name: string): string | undefined {
  return parseRequestCookies(request).find((cookie) => cookie.name === name)?.value;
}

function appendSetCookie(headers: Headers, cookie: CookieRecord) {
  headers.append(
    "Set-Cookie",
    serialize(cookie.name, cookie.value, {
      path: "/",
      sameSite: "lax",
      ...cookie.options,
    }),
  );
}

function createRedirectResponse(url: URL, cookies: CookieRecord[]): Response {
  const headers = new Headers({ Location: url.toString() });
  for (const cookie of cookies) {
    appendSetCookie(headers, cookie);
  }
  return new Response(null, { status: 302, headers });
}

function localeCookie(locale: string): CookieRecord {
  return {
    name: LOCALE_COOKIE_NAME,
    value: locale,
    options: { maxAge: LOCALE_COOKIE_MAX_AGE },
  };
}

function getLocaleFromRequest(request: Request, pathname: string): Locale {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }

  const cookieLocale = getCookieValue(request, LOCALE_COOKIE_NAME);
  if (cookieLocale && routing.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0];
    if (preferredLocale && routing.locales.includes(preferredLocale as Locale)) {
      return preferredLocale as Locale;
    }
  }

  return routing.defaultLocale;
}

/**
 * Redirect alias hosts (`www`, legacy `vibedevid.com`) to the canonical apex.
 * GET/HEAD use 301; other methods use 308 so POST bodies stay intact.
 * Runs for every path, including `/robots.txt` and `/sitemap.xml`.
 */
export function applyCanonicalHostRedirect(request: Request): Response | null {
  return canonicalHostRedirectResponse(request);
}

export function shouldSkipRequestMiddleware(pathname: string): boolean {
  // Better Auth owns /api/auth/* cookies. Rebuilding its response to add the
  // locale cookie dropped the session cookie under the Node dev server.
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_build") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/node_modules")
  ) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map|txt|xml|json)$/i.test(pathname);
}

/**
 * Locale middleware sets the NEXT_LOCALE cookie.
 * `/en` and other public path aliases redirect in `applyCanonicalHostRedirect`
 * so host and path changes stay on one response.
 * Auth middleware (signed-in redirect away from /user/auth, onboarding gate)
 * is also here because it needs to set cookies on redirect responses.
 *
 * Cookie handling for auth API routes (/api/auth/*) is now entirely handled
 * by better-auth's built-in handler (via tanstackStartCookies plugin).
 * No manual Set-Cookie merging needed — that was the source of the duplicate
 * cookie bug that caused sessions to be lost on refresh.
 */
export async function applyLocaleMiddleware(
  request: Request,
  pathname: string,
): Promise<Response | { localeCookies: CookieRecord[]; pathname: string }> {
  if (pathname === "/") {
    return { localeCookies: [localeCookie("id")], pathname };
  }

  return {
    localeCookies: [localeCookie(getLocaleFromRequest(request, pathname))],
    pathname,
  };
}

async function isUsernameClaimed(userId: string): Promise<boolean> {
  const [profile] = await getDb()
    .select({ claimedAt: users.usernameClaimedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(profile?.claimedAt);
}

export async function applyAuthMiddleware(
  request: Request,
  pathname: string,
  localeCookies: CookieRecord[],
): Promise<Response | { cookies: CookieRecord[] }> {
  const pendingCookies: CookieRecord[] = [...localeCookies];

  // Skip auth checks for better-auth's own API routes — they handle
  // their own session/cookie management.
  if (pathname.startsWith("/api/auth/")) {
    return { cookies: pendingCookies };
  }

  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    const requestUrl = new URL(request.url);
    const hasSession = Boolean(session?.user);
    const usernameClaimed = session?.user ? await isUsernameClaimed(session.user.id) : false;

    // Signed-in users skip the sign-in page. New users go to onboarding first.
    if (hasSession && pathname.startsWith(AUTH_PATH)) {
      const target = getSafeRedirectPath(requestUrl.searchParams.get("redirectTo"));
      const destination = usernameClaimed
        ? target
        : target === "/"
          ? ONBOARDING_PATH
          : `${ONBOARDING_PATH}?redirectTo=${encodeURIComponent(target)}`;
      return createRedirectResponse(new URL(destination, requestUrl.origin), pendingCookies);
    }

    const redirect = resolveOnboardingRedirect({
      method: request.method,
      pathname,
      search: requestUrl.search,
      hasSession,
      usernameClaimed,
    });
    if (redirect) {
      return createRedirectResponse(new URL(redirect, requestUrl.origin), pendingCookies);
    }
  } catch (error) {
    console.error("[request-middleware] auth error:", error);
  }

  return { cookies: pendingCookies };
}

/**
 * Merge locale/auth cookies into a route handler's response.
 *
 * This is ONLY for locale cookies (NEXT_LOCALE) —
 * NOT for auth session cookies. better-auth's tanstackStartCookies plugin
 * handles session cookies internally via the /api/auth/* catch-all route.
 *
 * The previous implementation used `new Headers(response.headers)` which
 * collapses multiple Set-Cookie values into a single comma-joined header
 * (per Fetch API spec), corrupting cookies. This version avoids that by
 * using getSetCookie() to preserve them as separate entries.
 */
export function withResponseCookies(response: Response, cookies: CookieRecord[]): Response {
  if (cookies.length === 0) return response;

  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      headers.set(key, value);
    }
  });
  // Preserve existing Set-Cookie headers as-is
  for (const existing of response.headers.getSetCookie()) {
    headers.append("Set-Cookie", existing);
  }
  // Append new cookies (locale)
  for (const cookie of cookies) {
    appendSetCookie(headers, cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
