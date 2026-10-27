/**
 * First URL segments that belong to app routes or static public dirs.
 * `/$username` must not treat these as profile slugs.
 */
const RESERVED_PROFILE_SLUGS = new Set([
  "admin",
  "api",
  "assets",
  "auth",
  "blog",
  "calendar",
  "dashboard",
  "event",
  "fonts",
  "logos",
  "optimized",
  "privacy-policy",
  "project",
  "robots.txt",
  "sitemap.xml",
  "terms",
  "terms-of-service",
  "testimonial",
  "user",
]);

export function isReservedProfileSlug(value: string): boolean {
  return RESERVED_PROFILE_SLUGS.has(value.trim().toLowerCase());
}

/**
 * Names nobody can claim or switch to, on top of the route slugs. Kept out of
 * RESERVED_PROFILE_SLUGS so an existing profile that already uses one of them
 * still resolves at `/$username`.
 */
const RESERVED_USERNAMES = new Set([
  "settings",
  "login",
  "logout",
  "signin",
  "signup",
  "onboarding",
  "www",
  "vibedev",
  "vibedevid",
  "root",
  "support",
  "help",
  "administrator",
  "admins",
  "mod",
  "moderator",
  "staff",
  "system",
]);

export function isReservedUsername(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return RESERVED_PROFILE_SLUGS.has(normalized) || RESERVED_USERNAMES.has(normalized);
}

/** Return typed params, or `false` so TanStack Router skips `/$username`. */
export function parseProfileUsernameParam(username: string): { username: string } | false {
  if (!username || isReservedProfileSlug(username)) {
    return false;
  }
  return { username };
}
