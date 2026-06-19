export function revalidatePath(_path: string, _type?: 'page' | 'layout') {
  /* TanStack: use router.invalidate() at call sites later */
}

export function revalidateTag(_tag: string, _type?: string) {}

export function unstable_cache<T extends (...args: never[]) => unknown>(
  fn: T,
  _keyParts?: string[],
  _options?: { revalidate?: number | false; tags?: string[] },
): T {
  return fn
}
