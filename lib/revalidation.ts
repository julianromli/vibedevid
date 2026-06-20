// Next.js → TanStack Start compatibility shims.
//
// In Next.js, `revalidatePath`/`revalidateTag` let a server action invalidate
// cached data from the server. TanStack Start has no server-driven cache
// invalidation: the *client* refetches after a mutation via
// `router.invalidate()`, and per-route freshness is controlled with the
// `staleTime` / `gcTime` loader options.
//
// These functions are intentional no-ops. They remain only so the many server
// actions that still call them compile unchanged. The actual revalidation now
// happens client-side at each call site (search the codebase for
// `router.invalidate()`), and route-level caching lives on the loaders (see
// `staleTime`/`gcTime` on `/blog/` and `/event/list`).
//
// TODO(tanstack-migration): remove these calls from server actions entirely and
// rely solely on client `router.invalidate()` + loader `staleTime`. Tracked as
// migration cleanup follow-up.

export function revalidatePath(_path: string, _type?: "page" | "layout") {
  // no-op — see file header. Use router.invalidate() on the client instead.
}

export function revalidateTag(_tag: string, _type?: string) {
  // no-op — see file header. Use router.invalidate() on the client instead.
}
