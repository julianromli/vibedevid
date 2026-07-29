import { CACHE_KEYS } from "@/lib/cache/keys";
import { memoryDeleteByPrefix } from "@/lib/cache/memory";
import { invalidateCacheKeys } from "@/lib/cache/cached";
import { redisDeleteByPrefix } from "@/lib/cache/redis";

export async function invalidateCategoriesCache(): Promise<void> {
  await invalidateCacheKeys(CACHE_KEYS.categories);
}

export async function invalidateVibeVideosCache(): Promise<void> {
  await invalidateCacheKeys(CACHE_KEYS.vibeVideos);
}

export async function invalidateProjectListCache(): Promise<void> {
  memoryDeleteByPrefix("vibedev:projects:list:");
  await redisDeleteByPrefix("vibedev:projects:list:");
  await invalidateCacheKeys(CACHE_KEYS.sitemap);
}

export async function invalidateBlogListCache(): Promise<void> {
  await invalidateCacheKeys(CACHE_KEYS.blogList, CACHE_KEYS.sitemap);
}

export async function invalidateEventListCache(): Promise<void> {
  await invalidateCacheKeys(CACHE_KEYS.eventList, CACHE_KEYS.sitemap);
}

export async function invalidatePublicContentCaches(): Promise<void> {
  await Promise.all([
    invalidateCategoriesCache(),
    invalidateVibeVideosCache(),
    invalidateProjectListCache(),
    invalidateBlogListCache(),
    invalidateEventListCache(),
  ]);
}
