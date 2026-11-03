/**
 * Role ids. Client-safe: no DB imports here, so routes can use these
 * constants without pulling getDb() into the browser bundle.
 */
export const USER_ROLE = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const;
