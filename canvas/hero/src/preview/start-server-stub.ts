/** Canvas-only stand-in: lib/locale.ts lazily imports this on the server path only. */
export function getCookie(_name: string): string | undefined {
  return undefined;
}
