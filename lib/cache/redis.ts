import { Redis } from "@upstash/redis";
import { getServerRuntimeSecrets } from "@/lib/server/runtime-secrets";

let _redis: Redis | null | undefined;

/**
 * Optional Upstash Redis client for Cloudflare Workers / Nitro.
 * Returns null when UPSTASH_* secrets are not configured so local/dev
 * and Neon-only deploys keep working without Redis.
 */
export function getRedis(): Redis | null {
  if (_redis !== undefined) {
    return _redis;
  }

  const { upstashRedisRestUrl, upstashRedisRestToken } = getServerRuntimeSecrets();
  if (!upstashRedisRestUrl || !upstashRedisRestToken) {
    _redis = null;
    return _redis;
  }

  _redis = new Redis({
    url: upstashRedisRestUrl,
    token: upstashRedisRestToken,
  });
  return _redis;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.warn("[cache/redis] get failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function redisSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.warn("[cache/redis] set failed:", error instanceof Error ? error.message : error);
  }
}

export async function redisDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn("[cache/redis] del failed:", error instanceof Error ? error.message : error);
  }
}

/** SET key if not exists — used for view-tracking dedupe without hitting Neon. */
export async function redisSetNx(key: string, ttlSeconds: number): Promise<boolean | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
    return result === "OK";
  } catch (error) {
    console.warn("[cache/redis] setnx failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function redisDeleteByPrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    let cursor = "0";
    do {
      const result = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      const nextCursor = String(result[0]);
      const keys = result[1] as string[];
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.warn(
      "[cache/redis] deleteByPrefix failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
