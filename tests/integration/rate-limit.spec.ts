import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { consumeRateLimit } from "@/lib/server/rate-limit";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb }));

const client = new PGlite();
const db = drizzle(client);
const windowMs = 60_000;
const now = 1_700_000_040_000; // Exact fixed-window boundary.

beforeAll(async () => {
  await client.exec(`CREATE TABLE rate_limit_buckets (
    bucket text PRIMARY KEY,
    count integer NOT NULL,
    window_start timestamptz NOT NULL
  )`);
});

beforeEach(async () => {
  await client.exec("TRUNCATE rate_limit_buckets");
  getDb.mockReturnValue(db);
});

afterAll(async () => {
  await client.close();
});

async function burst(bucket: string, at: number, requests = 20) {
  return Promise.all(
    Array.from({ length: requests }, () => consumeRateLimit(bucket, 5, windowMs, at)),
  );
}

describe("fixed-window rate limit in PostgreSQL", () => {
  it("admits only the limit when concurrent requests create a bucket", async () => {
    const results = await burst("new", now);
    expect(results.filter(Boolean)).toHaveLength(5);
    const rows = await client.query<{ count: number }>(
      "SELECT count FROM rate_limit_buckets WHERE bucket = 'new'",
    );
    expect(rows.rows[0].count).toBe(5);
  });

  it("admits only the remaining allowance for an existing bucket", async () => {
    await consumeRateLimit("existing", 5, windowMs, now);
    await consumeRateLimit("existing", 5, windowMs, now);
    expect((await burst("existing", now + 1)).filter(Boolean)).toHaveLength(3);
  });

  it("resets once at the next boundary under concurrent requests", async () => {
    expect((await burst("rollover", now)).filter(Boolean)).toHaveLength(5);
    expect(await consumeRateLimit("rollover", 5, windowMs, now + windowMs - 1)).toBe(false);
    expect((await burst("rollover", now + windowMs)).filter(Boolean)).toHaveLength(5);
  });

  it("does not reset a newer window for a delayed request", async () => {
    await burst("delayed", now + windowMs);
    expect(await consumeRateLimit("delayed", 5, windowMs, now)).toBe(false);
    expect(await consumeRateLimit("delayed", 5, windowMs, now + windowMs)).toBe(false);
  });

  it("keeps bucket allowances independent", async () => {
    const [first, second] = await Promise.all([burst("first", now), burst("second", now)]);
    expect(first.filter(Boolean)).toHaveLength(5);
    expect(second.filter(Boolean)).toHaveLength(5);
  });
});
