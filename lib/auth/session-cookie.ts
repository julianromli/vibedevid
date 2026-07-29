/**
 * Detect whether the request likely carries a Better Auth session cookie
 * before paying for a Neon roundtrip via `auth.api.getSession()`.
 *
 * Cookie names follow Better Auth defaults:
 * - `better-auth.session_token` (http)
 * - `__Secure-better-auth.session_token` (https production)
 */

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
] as const;

export function hasBetterAuthSessionCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;

  // Fast path: avoid splitting when the header clearly has no auth cookie.
  if (!cookieHeader.includes("better-auth.session")) {
    return false;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const name = part.trim().split("=")[0];
    if ((SESSION_COOKIE_NAMES as readonly string[]).includes(name)) {
      return true;
    }
  }
  return false;
}

export function hasBetterAuthSessionCookieFromRequest(request: Request): boolean {
  return hasBetterAuthSessionCookie(request.headers.get("cookie"));
}
