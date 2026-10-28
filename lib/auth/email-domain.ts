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

/**
 * Exact addresses that may create an account outside the domain list, from a
 * comma-separated value (env `NEW_ACCOUNT_ALLOWED_EMAILS`). Entries without a
 * local part are dropped so a bare domain can never open the whole domain.
 */
export function parseAllowedEmails(raw: string | undefined): ReadonlySet<string> {
  const emails = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => {
      const at = entry.indexOf("@");
      return at > 0 && at === entry.lastIndexOf("@") && at < entry.length - 1;
    });
  return new Set(emails);
}

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
  input: { existingUser: boolean; allowedEmails?: ReadonlySet<string> },
): NewAccountEmailError | null {
  if (input.existingUser) return null;
  const domain = getEmailDomain(email);
  if (!domain) return { code: "INVALID_EMAIL", domain: null };
  if (input.allowedEmails?.has(email.trim().toLowerCase())) return null;
  if (!NEW_ACCOUNT_EMAIL_DOMAINS.has(domain)) return { code: "EMAIL_DOMAIN_NOT_ALLOWED", domain };
  return null;
}
