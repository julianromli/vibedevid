import { getSafeRedirectPath } from "@/lib/auth/redirect-path";

export const ONBOARDING_PATH = "/user/onboarding";
export const AUTH_PATH = "/user/auth";

/** Paths an unclaimed user can still reach: auth, onboarding, APIs, server functions, legal pages. */
const EXEMPT_PREFIXES = [
  AUTH_PATH,
  ONBOARDING_PATH,
  "/api/",
  "/_serverFn/",
  "/terms-of-service",
  "/privacy-policy",
];

function startsWithSegment(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname.startsWith(prefix);
  return (
    pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`)
  );
}

export function isOnboardingExemptPath(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => startsWithSegment(pathname, prefix));
}

function withRedirectTo(path: string, target: string): string {
  if (target === "/") return path;
  return `${path}?redirectTo=${encodeURIComponent(target)}`;
}

/**
 * Where to send this request, or null to let it through.
 * - Unclaimed user on any page: onboarding, keeping the page they wanted.
 * - Guest on onboarding: sign in first.
 * - Claimed user on onboarding: the safe `redirectTo` target.
 */
export function resolveOnboardingRedirect(input: {
  method: string;
  pathname: string;
  search: string;
  hasSession: boolean;
  usernameClaimed: boolean;
}): string | null {
  const method = input.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return null;

  if (startsWithSegment(input.pathname, ONBOARDING_PATH)) {
    // After sign-in the gate sends a new user back here, so no redirectTo is needed.
    if (!input.hasSession) return AUTH_PATH;
    if (!input.usernameClaimed) return null;
    return getSafeRedirectPath(new URLSearchParams(input.search).get("redirectTo"));
  }

  if (!input.hasSession || input.usernameClaimed) return null;
  if (isOnboardingExemptPath(input.pathname)) return null;

  return withRedirectTo(ONBOARDING_PATH, `${input.pathname}${input.search}`);
}
