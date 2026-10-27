import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimitBuckets } from "@/lib/db/schema";

interface BucketState {
  count: number;
  windowStart: number;
}

const memoryBuckets = new Map<string, BucketState>();

export function resetRateLimitMemoryForTests(): void {
  memoryBuckets.clear();
  anchoredMemoryBuckets.clear();
}

function consumeMemory(bucket: string, limit: number, windowMs: number, now: number): boolean {
  const windowStart = now - (now % windowMs);
  const current = memoryBuckets.get(bucket);
  if (!current || current.windowStart !== windowStart) {
    memoryBuckets.set(bucket, { count: 1, windowStart });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

async function consumeDatabase(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<boolean> {
  const windowStartMs = now - (now % windowMs);
  const windowStart = new Date(windowStartMs);
  const expired = sql`${rateLimitBuckets.windowStart} < ${windowStart}`;
  // The conflict handler locks the bucket row. Check the allowance and update
  // the count together, so concurrent callers cannot spend the same slot.
  const [row] = await getDb()
    .insert(rateLimitBuckets)
    .values({ bucket, count: 1, windowStart })
    .onConflictDoUpdate({
      target: rateLimitBuckets.bucket,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${windowStart} ELSE ${rateLimitBuckets.windowStart} END`,
      },
      setWhere: sql`${expired} OR ${rateLimitBuckets.count} < ${limit}`,
    })
    .returning({ count: rateLimitBuckets.count });

  // A full bucket is excluded by setWhere and returns no row.
  return row !== undefined;
}

/**
 * Returns true when the caller is still inside the limit.
 * Uses Neon when `rate_limit_buckets` exists. If that query fails (migration
 * not applied, or the database is down), falls back to memory in this isolate.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  try {
    return await consumeDatabase(bucket, limit, windowMs, now);
  } catch (error) {
    console.warn("Rate limit store unavailable; using in-memory fallback:", error);
    return consumeMemory(bucket, limit, windowMs, now);
  }
}

export type WindowedLimitResult = { allowed: boolean; retryAfterSeconds: number };

const anchoredMemoryBuckets = new Map<string, BucketState>();

function consumeAnchoredMemory(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number,
): WindowedLimitResult {
  const current = anchoredMemoryBuckets.get(bucket);
  if (!current || now >= current.windowStart + windowMs) {
    anchoredMemoryBuckets.set(bucket, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.windowStart + windowMs - now) / 1000)),
  };
}

async function consumeAnchoredDatabase(
  bucket: string,
  limit: number,
  windowMs: number,
  now: number,
): Promise<WindowedLimitResult> {
  const nowDate = new Date(now);
  const windowSeconds = windowMs / 1000;
  const expired = sql`${rateLimitBuckets.windowStart} + make_interval(secs => ${windowSeconds}) <= ${nowDate}`;
  const [row] = await getDb()
    .insert(rateLimitBuckets)
    .values({ bucket, count: 1, windowStart: nowDate })
    .onConflictDoUpdate({
      target: rateLimitBuckets.bucket,
      set: {
        count: sql`CASE WHEN ${expired} THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStart: sql`CASE WHEN ${expired} THEN ${nowDate} ELSE ${rateLimitBuckets.windowStart} END`,
      },
    })
    .returning({ count: rateLimitBuckets.count, windowStart: rateLimitBuckets.windowStart });

  if (!row) return { allowed: true, retryAfterSeconds: 0 };
  const windowStartMs = new Date(row.windowStart).getTime();
  return {
    allowed: row.count <= limit,
    retryAfterSeconds:
      row.count <= limit ? 0 : Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)),
  };
}

/**
 * Window starts at the first hit (not at a clock boundary), so a 60s
 * cooldown really lasts 60s. One atomic upsert in Neon; memory fallback
 * like `consumeRateLimit`. Returns the seconds left when blocked.
 */
export async function consumeWindowedRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<WindowedLimitResult> {
  try {
    return await consumeAnchoredDatabase(bucket, limit, windowMs, now);
  } catch (error) {
    console.warn("Rate limit store unavailable; using in-memory fallback:", error);
    const result = consumeAnchoredMemory(bucket, limit, windowMs, now);
    return result.allowed ? { allowed: true, retryAfterSeconds: 0 } : result;
  }
}

export function clientIpFromHeaders(headers: Headers): string {
  const cloudflare = headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
