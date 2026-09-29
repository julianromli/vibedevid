import { describe, expect, it } from "vite-plus/test";
import {
  decodeProjectCursor,
  encodeProjectCursor,
  PROJECT_PAGE_SIZE,
  trendingScore,
} from "@/lib/project-page-cursor";
import { isBotUserAgent } from "@/lib/bot-user-agent";

describe("project page cursor", () => {
  it("round-trips a keyset cursor", () => {
    const cursor = {
      id: 12,
      createdAt: "2026-08-01T00:00:00.000Z",
      likes: 4,
      score: 0.5,
    };

    expect(decodeProjectCursor(encodeProjectCursor(cursor))).toEqual(cursor);
  });

  it("rejects a malformed cursor", () => {
    expect(decodeProjectCursor("not-a-cursor")).toBeNull();
    expect(decodeProjectCursor(null)).toBeNull();
  });

  it("uses a stable page size", () => {
    expect(PROJECT_PAGE_SIZE).toBe(18);
  });

  it("scores newer projects higher than older ones with the same likes", () => {
    const now = Date.parse("2026-09-01T00:00:00.000Z");
    const newer = trendingScore(2, "2026-08-30T00:00:00.000Z", now);
    const older = trendingScore(2, "2026-01-01T00:00:00.000Z", now);
    expect(newer).toBeGreaterThan(older);
  });
});

describe("isBotUserAgent", () => {
  it("skips crawlers and keeps normal browsers", () => {
    expect(isBotUserAgent("Mozilla/5.0 Googlebot/2.1")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Macintosh) Chrome/120.0.0.0")).toBe(false);
  });
});
