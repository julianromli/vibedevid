export function revalidatePath(_path: string) {
  /* TanStack: use router.invalidate() at call sites later */
}

export function revalidateTag(_tag: string) {}

export function unstable_cache<T extends (...args: never[]) => unknown>(
  fn: T,
  _keyParts?: string[],
  _options?: { revalidate?: number | false; tags?: string[] },
): T {
  return fn
}
