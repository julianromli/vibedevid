/**
 * Build a LIKE/ILIKE pattern that matches `value` anywhere in the column.
 * `\`, `%` and `_` in `value` match literally, using Postgres's default
 * backslash escape character.
 */
export function containsPattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
