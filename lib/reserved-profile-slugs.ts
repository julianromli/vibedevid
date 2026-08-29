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

/** Return typed params, or `false` so TanStack Router skips `/$username`. */
export function parseProfileUsernameParam(username: string): { username: string } | false {
  if (!username || isReservedProfileSlug(username)) {
    return false;
  }
  return { username };
}
