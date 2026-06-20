import { type CookieSerializeOptions, serialize } from "cookie-es";
import { type Locale, routing } from "@/i18n/routing";
import { getSafeRedirectPath } from "@/lib/auth/credentials";
import { getAuth } from "@/lib/auth/server";
import { CONFIRM_EMAIL_COOKIE, CONFIRM_EMAIL_COOKIE_MAX_AGE_SECONDS } from "@/lib/constants/auth";

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

function appendSetCookies(headers: Headers, source?: Headers) {
  if (!source) return;
  for (const cookie of source.getSetCookie()) {
    headers.append("Set-Cookie", cookie);
  }
}

function mergeCookiesIntoResponse(response: Response, cookies: CookieRecord[]): Response {
  if (cookies.length === 0) return response;

  const headers = new Headers(response.headers);
  for (const cookie of cookies) {
    appendSetCookie(headers, cookie);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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
    name: LOCALE_COOKIE,
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

  const cookieLocale = getCookieValue(request, LOCALE_COOKIE);
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

export function shouldSkipRequestMiddleware(pathname: string): boolean {
  if (
    pathname.startsWith("/_build") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/node_modules")
  ) {
    return true;
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map|txt|xml|json)$/i.test(pathname);
}

export async function applyLocaleMiddleware(
  request: Request,
  pathname: string,
): Promise<Response | { localeCookies: CookieRecord[]; pathname: string }> {
  const requestUrl = new URL(request.url);

  if (pathname.startsWith("/en")) {
    const strippedPath = pathname.replace(/^\/en/, "") || "/";
    const redirectUrl = new URL(
      strippedPath + requestUrl.search + requestUrl.hash,
      requestUrl.origin,
    );
    return createRedirectResponse(redirectUrl, [localeCookie("en")]);
  }

  if (pathname === "/") {
    return { localeCookies: [localeCookie("id")], pathname };
  }

  return {
    localeCookies: [localeCookie(getLocaleFromRequest(request, pathname))],
    pathname,
  };
}

export async function applyAuthMiddleware(
  request: Request,
  pathname: string,
  localeCookies: CookieRecord[],
): Promise<Response | { cookies: CookieRecord[] }> {
  const pendingCookies: CookieRecord[] = [...localeCookies];

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    const requestUrl = new URL(request.url);

    const isAuthPath = pathname.startsWith("/user/auth");
    const isConfirmEmailPath = pathname.includes("/confirm-email");
    const isCallbackPath =
      pathname.startsWith("/api/auth/callback") || pathname.includes("/auth/callback");
    const hasConfirmEmailCookie = Boolean(getCookieValue(request, CONFIRM_EMAIL_COOKIE));

    if (session?.user && isAuthPath && !isConfirmEmailPath && !isCallbackPath) {
      const redirectTo = getSafeRedirectPath(requestUrl.searchParams.get("redirectTo"));
      return createRedirectResponse(new URL(redirectTo, requestUrl.origin), pendingCookies);
    }

    if (session?.user && !session.user.emailVerified && !isAuthPath && !isCallbackPath) {
      const redirectResponse = createRedirectResponse(
        new URL("/user/auth/confirm-email", requestUrl.origin),
        [
          ...pendingCookies,
          {
            name: CONFIRM_EMAIL_COOKIE,
            value: encodeURIComponent(session.user.email || ""),
            options: {
              path: "/user/auth/confirm-email",
              maxAge: CONFIRM_EMAIL_COOKIE_MAX_AGE_SECONDS,
              sameSite: "lax",
              secure: requestUrl.protocol === "https:",
            },
          },
        ],
      );

      const signOutResponse = await auth.api.signOut({
        headers: request.headers,
        asResponse: true,
      });
      return new Response(redirectResponse.body, {
        status: redirectResponse.status,
        statusText: redirectResponse.statusText,
        headers: (() => {
          const headers = new Headers(redirectResponse.headers);
          appendSetCookies(headers, signOutResponse.headers);
          return headers;
        })(),
      });
    }

    if (session?.user?.emailVerified && isConfirmEmailPath && !hasConfirmEmailCookie) {
      return createRedirectResponse(new URL("/", requestUrl.origin), pendingCookies);
    }
  } catch (error) {
    console.error("[request-middleware] auth error:", error);
  }

  return { cookies: pendingCookies };
}

export function withResponseCookies(response: Response, cookies: CookieRecord[]): Response {
  return mergeCookiesIntoResponse(response, cookies);
}
