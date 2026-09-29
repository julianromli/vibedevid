import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rateLimitBuckets } from "@/lib/db/schema";

interface BucketState {
  count: number;
  windowStart: number;
}

const memoryBuckets = new Map<string, BucketState>();

export function resetRateLimitMemoryForTests(): void {
  memoryBuckets.clear();
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
  const db = getDb();
  const [row] = await db
    .select({ count: rateLimitBuckets.count, windowStart: rateLimitBuckets.windowStart })
    .from(rateLimitBuckets)
    .where(eq(rateLimitBuckets.bucket, bucket))
    .limit(1);

  if (!row || row.windowStart.getTime() !== windowStartMs) {
    await db
      .insert(rateLimitBuckets)
      .values({ bucket, count: 1, windowStart })
      .onConflictDoUpdate({
        target: rateLimitBuckets.bucket,
        set: { count: 1, windowStart },
      });
    return true;
  }

  if (row.count >= limit) return false;

  await db
    .update(rateLimitBuckets)
    .set({ count: row.count + 1 })
    .where(eq(rateLimitBuckets.bucket, bucket));
  return true;
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

export function clientIpFromHeaders(headers: Headers): string {
  const cloudflare = headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
