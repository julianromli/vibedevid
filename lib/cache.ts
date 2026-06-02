/** No-op cache helpers (Next.js revalidation replaced by TanStack Query on the client). */

export function revalidatePath(_path: string, _type?: string): void {
  // intentionally empty
}

export function revalidateTag(_tag: string, _profile?: string): void {
  // intentionally empty
}

export function unstable_cache<T>(fn: () => Promise<T>, _keyParts?: string[], _options?: unknown): () => Promise<T> {
  return () => fn()
}
