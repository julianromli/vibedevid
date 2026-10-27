import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { checkOtpSendAllowed, checkOtpVerifyAllowed } from "@/lib/auth/otp-guards";
import { consumeWindowedRateLimit, resetRateLimitMemoryForTests } from "@/lib/server/rate-limit";

vi.mock("@/lib/db", () => ({
  getDb: () => {
    throw new Error("rate_limit_buckets is missing");
  },
}));

const T0 = 1_800_000_000_000;

function clock(start: number) {
  let now = start;
  return {
    consume: (bucket: string, limit: number, windowMs: number) =>
      consumeWindowedRateLimit(bucket, limit, windowMs, now),
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("OTP send limits", () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("enforces a 60s resend cooldown per email and reports the time left", async () => {
    const c = clock(T0 + 59_000); // not aligned to a minute boundary on purpose
    await expect(
      checkOtpSendAllowed({ email: "a@gmail.com", ip: "1.1.1.1", consume: c.consume }),
    ).resolves.toBeNull();
    c.advance(18_000);
    await expect(
      checkOtpSendAllowed({ email: "a@gmail.com", ip: "1.1.1.1", consume: c.consume }),
    ).resolves.toEqual({
      code: "OTP_RESEND_COOLDOWN",
      retryAfterSeconds: 42,
    });
    c.advance(42_000);
    await expect(
      checkOtpSendAllowed({ email: "a@gmail.com", ip: "1.1.1.1", consume: c.consume }),
    ).resolves.toBeNull();
  });

  it("caps sends per email per hour", async () => {
    const c = clock(T0);
    for (let i = 0; i < 5; i++) {
      await expect(
        checkOtpSendAllowed({ email: "b@gmail.com", ip: `2.2.2.${i}`, consume: c.consume }),
      ).resolves.toBeNull();
      c.advance(61_000);
    }
    // 5 sends, 61s apart: the hour started 305s ago.
    await expect(
      checkOtpSendAllowed({ email: "b@gmail.com", ip: "2.2.2.9", consume: c.consume }),
    ).resolves.toEqual({
      code: "OTP_SEND_LIMIT",
      retryAfterSeconds: 3600 - 305,
    });
  });

  it("caps sends per IP per hour across emails", async () => {
    const c = clock(T0);
    for (let i = 0; i < 20; i++) {
      await expect(
        checkOtpSendAllowed({ email: `u${i}@gmail.com`, ip: "3.3.3.3", consume: c.consume }),
      ).resolves.toBeNull();
    }
    await expect(
      checkOtpSendAllowed({ email: "u99@gmail.com", ip: "3.3.3.3", consume: c.consume }),
    ).resolves.toEqual({
      code: "OTP_SEND_LIMIT",
      retryAfterSeconds: 3600,
    });
  });

  it("treats email case as the same bucket", async () => {
    const c = clock(T0);
    await checkOtpSendAllowed({ email: "Case@Gmail.com", ip: "4.4.4.4", consume: c.consume });
    await expect(
      checkOtpSendAllowed({ email: "case@gmail.com", ip: "4.4.4.5", consume: c.consume }),
    ).resolves.toEqual({
      code: "OTP_RESEND_COOLDOWN",
      retryAfterSeconds: 60,
    });
  });
});

describe("OTP verify limits", () => {
  beforeEach(() => {
    resetRateLimitMemoryForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("caps verify calls per IP per 10 minutes", async () => {
    const c = clock(T0);
    for (let i = 0; i < 30; i++) {
      await expect(
        checkOtpVerifyAllowed({ ip: "5.5.5.5", consume: c.consume }),
      ).resolves.toBeNull();
    }
    await expect(checkOtpVerifyAllowed({ ip: "5.5.5.5", consume: c.consume })).resolves.toEqual({
      code: "OTP_VERIFY_LIMIT",
      retryAfterSeconds: 600,
    });
    c.advance(600_000);
    await expect(checkOtpVerifyAllowed({ ip: "5.5.5.5", consume: c.consume })).resolves.toBeNull();
  });
});
