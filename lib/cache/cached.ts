import { CACHE_TTL } from "@/lib/cache/keys";
import { memoryDelete, memoryGet, memorySet } from "@/lib/cache/memory";
import { redisDel, redisGet, redisSet } from "@/lib/cache/redis";

export interface CachedOptions<T> {
  key: string;
  ttlSeconds: number;
  /** In-isolate memory TTL. Defaults to min(ttlSeconds, 5 min). */
  memoryTtlMs?: number;
  loader: () => Promise<T>;
  /** Used when loader throws (e.g. Neon down). */
  fallback?: () => T | Promise<T>;
}

/**
 * Layered read-through cache:
 * 1. Worker memory (fast, per-isolate)
 * 2. Upstash Redis (shared across Workers, optional)
 * 3. loader (usually Neon)
 * 4. optional static/hardcoded fallback
 */
export async function cachedGet<T>(options: CachedOptions<T>): Promise<T> {
  const memoryTtlMs =
    options.memoryTtlMs ?? Math.min(options.ttlSeconds * 1000, CACHE_TTL.memoryCategoriesMs);

  const fromMemory = memoryGet<T>(options.key);
  if (fromMemory !== null) {
    return fromMemory;
  }

  const fromRedis = await redisGet<T>(options.key);
  if (fromRedis !== null) {
    memorySet(options.key, fromRedis, memoryTtlMs);
    return fromRedis;
  }

  try {
    const value = await options.loader();
    memorySet(options.key, value, memoryTtlMs);
    await redisSet(options.key, value, options.ttlSeconds);
    return value;
  } catch (error) {
    if (options.fallback) {
      console.warn(
        "[cache] loader failed, using fallback:",
        error instanceof Error ? error.message : error,
      );
      const fallbackValue = await options.fallback();
      memorySet(options.key, fallbackValue, memoryTtlMs);
      return fallbackValue;
    }
    throw error;
  }
}

export async function invalidateCacheKeys(...keys: string[]): Promise<void> {
  for (const key of keys) {
    memoryDelete(key);
  }
  await redisDel(...keys);
}
