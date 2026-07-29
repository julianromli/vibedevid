/** Shared cache key prefixes and TTLs (seconds). */

export const CACHE_TTL = {
  categories: 60 * 60,
  vibeVideos: 30 * 60,
  projectList: 60,
  blogList: 60,
  eventList: 60,
  sitemap: 60 * 60,
  viewDedup: 60 * 60 * 24,
  memoryCategoriesMs: 5 * 60 * 1000,
  clientProjectListMs: 60 * 1000,
  clientCategoriesMs: 30 * 60 * 1000,
} as const;

export const CACHE_KEYS = {
  categories: "vibedev:categories:v1",
  vibeVideos: "vibedev:vibe-videos:v1",
  blogList: "vibedev:blog:published:v1",
  eventList: "vibedev:events:approved:v1",
  sitemap: "vibedev:sitemap:dynamic:v1",
  projectList: (sortBy: string, category: string | undefined, limit: number) =>
    `vibedev:projects:list:v1:${sortBy}:${category ?? "all"}:${limit}`,
  blogView: (postId: string, sessionId: string) => `vibedev:view:blog:${postId}:${sessionId}`,
  projectView: (projectId: number, sessionId: string) =>
    `vibedev:view:project:${projectId}:${sessionId}`,
} as const;

export const CLIENT_STORAGE_KEYS = {
  categories: "vibedev_cache_categories_v1",
  projectList: "vibedev_cache_project_list_v1",
} as const;
