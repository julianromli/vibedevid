import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { guestCommentNameError } from "@/lib/comment-policy";
import { sniffImageMime } from "@/lib/image-sniff";
import { consumeRateLimit, resetRateLimitMemoryForTests } from "@/lib/server/rate-limit";

vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("rate_limit_buckets is missing");
  },
}));

const SVG = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");

describe("guest comments", () => {
  it("requires a guest name of at least 2 characters", () => {
    expect(guestCommentNameError(" ")).toBe("Enter your name to comment");
    expect(guestCommentNameError("A")).toBe("Enter your name to comment");
    expect(guestCommentNameError("Ad")).toBeNull();
  });
});

describe("project image bytes", () => {
  it("rejects SVG payloads", () => {
    expect(sniffImageMime(SVG)).toBeNull();
  });
});

describe("consumeRateLimit memory fallback", () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
  });

  it("allows the limit, then blocks, and resets in the next window", async () => {
    const bucket = "guest-comment:test";
    const windowMs = 60_000;
    const now = 1_700_000_000_000;

    await expect(consumeRateLimit(bucket, 2, windowMs, now)).resolves.toBe(true);
    await expect(consumeRateLimit(bucket, 2, windowMs, now + 1)).resolves.toBe(true);
    await expect(consumeRateLimit(bucket, 2, windowMs, now + 2)).resolves.toBe(false);
    await expect(consumeRateLimit(bucket, 2, windowMs, now + windowMs)).resolves.toBe(true);
  });
});
