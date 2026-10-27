/** Email domains a NEW account may use. Existing accounts sign in with any domain. */
export const NEW_ACCOUNT_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.id",
  "outlook.com",
  "outlook.co.id",
  "hotmail.com",
  "live.com",
]);

export type NewAccountEmailError =
  | { code: "EMAIL_DOMAIN_NOT_ALLOWED"; domain: string }
  | { code: "INVALID_EMAIL"; domain: null };

export function getEmailDomain(value: string): string | null {
  const at = value.lastIndexOf("@");
  if (at === -1) return null;
  const domain = value
    .slice(at + 1)
    .trim()
    .toLowerCase();
  return domain || null;
}

/**
 * Returns why this email may not create an account, or null when it may
 * sign in. Existing users are never blocked by the allowlist.
 */
export function newAccountEmailError(
  email: string,
  input: { existingUser: boolean },
): NewAccountEmailError | null {
  if (input.existingUser) return null;
  const domain = getEmailDomain(email);
  if (!domain) return { code: "INVALID_EMAIL", domain: null };
  if (!NEW_ACCOUNT_EMAIL_DOMAINS.has(domain)) return { code: "EMAIL_DOMAIN_NOT_ALLOWED", domain };
  return null;
}
