/**
 * Safe redirect path validation — prevents open-redirect attacks.
 *
 * Only allows relative paths starting with "/" but not "//" or "/\".
 * Paths starting with "/user/auth" are also rejected to prevent
 * redirect loops after login.
 */
export function getSafeRedirectPath(
  value: FormDataEntryValue | null | string | undefined,
): string {
  if (typeof value !== "string" || !value.trim()) return "/";

  const trimmed = value.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("/user/auth")
  ) {
    return "/";
  }

  return trimmed;
}
