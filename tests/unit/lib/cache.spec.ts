import { afterEach, describe, expect, it } from "vite-plus/test";
import { hasBetterAuthSessionCookie } from "@/lib/auth/session-cookie";
import { cachedGet, invalidateCacheKeys } from "@/lib/cache/cached";
import { memoryDelete, memoryGet, memorySet } from "@/lib/cache/memory";

describe("memory cache", () => {
  afterEach(() => {
    memoryDelete("test:key");
  });

  it("stores and returns values before expiry", () => {
    memorySet("test:key", { ok: true }, 60_000);
    expect(memoryGet<{ ok: boolean }>("test:key")).toEqual({ ok: true });
  });

  it("expires values", () => {
    memorySet("test:key", "stale", -1);
    expect(memoryGet<string>("test:key")).toBeNull();
  });
});

describe("cachedGet", () => {
  afterEach(async () => {
    await invalidateCacheKeys("test:cached");
  });

  it("calls loader once and serves memory on second read", async () => {
    let loads = 0;
    const first = await cachedGet({
      key: "test:cached",
      ttlSeconds: 60,
      loader: async () => {
        loads += 1;
        return { n: loads };
      },
    });
    const second = await cachedGet({
      key: "test:cached",
      ttlSeconds: 60,
      loader: async () => {
        loads += 1;
        return { n: loads };
      },
    });

    expect(first).toEqual({ n: 1 });
    expect(second).toEqual({ n: 1 });
    expect(loads).toBe(1);
  });

  it("uses fallback when loader throws", async () => {
    const value = await cachedGet({
      key: "test:cached-fallback",
      ttlSeconds: 60,
      loader: async () => {
        throw new Error("db down");
      },
      fallback: () => ({ source: "static" }),
    });

    expect(value).toEqual({ source: "static" });
    await invalidateCacheKeys("test:cached-fallback");
  });
});

describe("hasBetterAuthSessionCookie", () => {
  it("returns false without cookie header", () => {
    expect(hasBetterAuthSessionCookie(null)).toBe(false);
    expect(hasBetterAuthSessionCookie("NEXT_LOCALE=id")).toBe(false);
  });

  it("detects better-auth session cookies", () => {
    expect(hasBetterAuthSessionCookie("better-auth.session_token=abc")).toBe(true);
    expect(hasBetterAuthSessionCookie("foo=1; __Secure-better-auth.session_token=xyz; bar=2")).toBe(
      true,
    );
  });
});
