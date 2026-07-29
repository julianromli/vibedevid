// Next.js → TanStack Start compatibility shims.
//
// In Next.js, `revalidatePath`/`revalidateTag` let a server action invalidate
// cached data from the server. TanStack Start has no server-driven HTML cache
// invalidation: the *client* refetches after a mutation via
// `router.invalidate()`, and per-route freshness is controlled with the
// `staleTime` / `gcTime` loader options.
//
// These helpers still invalidate our Upstash/memory public-content caches so
// mutations (new project, blog publish, event approval, etc.) drop stale Redis
// entries. Client navigations continue to use `router.invalidate()`.

import {
  invalidateBlogListCache,
  invalidateEventListCache,
  invalidateProjectListCache,
  invalidatePublicContentCaches,
  invalidateVibeVideosCache,
} from "@/lib/cache/invalidate";

function schedule(task: () => Promise<void>) {
  void task().catch((error) => {
    console.warn(
      "[revalidation] cache invalidate failed:",
      error instanceof Error ? error.message : error,
    );
  });
}

export function revalidatePath(path: string, _type?: "page" | "layout") {
  if (path.startsWith("/project") || path === "/") {
    schedule(invalidateProjectListCache);
  }
  if (path.startsWith("/blog")) {
    schedule(invalidateBlogListCache);
  }
  if (path.startsWith("/event")) {
    schedule(invalidateEventListCache);
  }
  if (path.includes("vibe") || path === "/") {
    schedule(invalidateVibeVideosCache);
  }
}

export function revalidateTag(tag: string, _type?: string) {
  if (tag.includes("blog")) {
    schedule(invalidateBlogListCache);
  } else if (tag.includes("event")) {
    schedule(invalidateEventListCache);
  } else if (tag.includes("project")) {
    schedule(invalidateProjectListCache);
  } else {
    schedule(invalidatePublicContentCaches);
  }
}
