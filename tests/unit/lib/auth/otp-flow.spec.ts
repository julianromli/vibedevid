import { describe, expect, it } from "vite-plus/test";
import {
  attemptsLeft,
  clearOtpPending,
  formatCountdown,
  isEmailFormatValid,
  isOtpPendingExpired,
  OTP_PENDING_STORAGE_KEY,
  readOtpPending,
  resendSecondsLeft,
  sentAtFromRetryAfter,
  toSendOutcome,
  toVerifyOutcome,
  writeOtpPending,
} from "@/lib/auth/otp-flow";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

const T0 = Date.parse("2026-10-27T10:00:00.000Z");

describe("pending storage", () => {
  it("round-trips and clears", () => {
    const storage = memoryStorage();
    writeOtpPending(storage, {
      email: "a@gmail.com",
      sentAt: new Date(T0).toISOString(),
      wrongAttempts: 2,
    });
    expect(readOtpPending(storage)).toEqual({
      email: "a@gmail.com",
      sentAt: new Date(T0).toISOString(),
      wrongAttempts: 2,
    });
    clearOtpPending(storage);
    expect(readOtpPending(storage)).toBeNull();
  });

  it("ignores broken values", () => {
    const storage = memoryStorage();
    storage.setItem(OTP_PENDING_STORAGE_KEY, "{not json");
    expect(readOtpPending(storage)).toBeNull();
    storage.setItem(
      OTP_PENDING_STORAGE_KEY,
      JSON.stringify({ email: "a@gmail.com", sentAt: "nope" }),
    );
    expect(readOtpPending(storage)).toBeNull();
    expect(readOtpPending(null)).toBeNull();
  });

  it("expires 10 minutes after sending", () => {
    const pending = { email: "a@gmail.com", sentAt: new Date(T0).toISOString(), wrongAttempts: 0 };
    expect(isOtpPendingExpired(pending, T0 + 599_000)).toBe(false);
    expect(isOtpPendingExpired(pending, T0 + 600_000)).toBe(true);
  });
});

describe("resend countdown", () => {
  it("counts down from sentAt", () => {
    const sentAt = new Date(T0).toISOString();
    expect(resendSecondsLeft(sentAt, T0)).toBe(60);
    expect(resendSecondsLeft(sentAt, T0 + 18_200)).toBe(42);
    expect(resendSecondsLeft(sentAt, T0 + 60_000)).toBe(0);
    expect(resendSecondsLeft(null, T0)).toBe(0);
  });

  it("backs out sentAt from the server's seconds left", () => {
    expect(resendSecondsLeft(sentAtFromRetryAfter(42, T0), T0)).toBe(42);
  });

  it("formats m:ss", () => {
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(5)).toBe("0:05");
  });

  it("counts attempts left", () => {
    expect(attemptsLeft(0)).toBe(5);
    expect(attemptsLeft(4)).toBe(1);
    expect(attemptsLeft(9)).toBe(0);
  });
});

describe("email format", () => {
  it("checks format only, not the domain", () => {
    expect(isEmailFormatValid(" Name@Company.co ")).toBe(true);
    expect(isEmailFormatValid("name@")).toBe(false);
    expect(isEmailFormatValid("name")).toBe(false);
  });
});

describe("toSendOutcome", () => {
  it("uses the server sentAt", () => {
    expect(toSendOutcome({ data: { sentAt: "2026-10-27T10:00:00.000Z" } }, T0 + 5000)).toEqual({
      kind: "sent",
      sentAt: "2026-10-27T10:00:00.000Z",
    });
  });

  it("treats cooldown as already sent", () => {
    const outcome = toSendOutcome(
      { error: { code: "OTP_RESEND_COOLDOWN", status: 429, retryAfterSeconds: 30 } },
      T0,
    );
    expect(outcome.kind).toBe("cooldown");
    if (outcome.kind === "cooldown") expect(resendSecondsLeft(outcome.sentAt, T0)).toBe(30);
  });

  it("maps errors", () => {
    expect(
      toSendOutcome({
        error: { code: "EMAIL_DOMAIN_NOT_ALLOWED", status: 400, domain: "corp.com" },
      }),
    ).toEqual({
      kind: "error",
      error: "emailDomain",
      domain: "corp.com",
    });
    expect(toSendOutcome({ error: { code: "OTP_SEND_LIMIT", status: 429 } })).toEqual({
      kind: "error",
      error: "sendLimit",
    });
    expect(toSendOutcome({ error: { code: "EMAIL_NOT_CONFIGURED", status: 503 } })).toEqual({
      kind: "error",
      error: "generic",
    });
    expect(toSendOutcome({ error: { status: 0 } })).toEqual({ kind: "error", error: "network" });
  });
});

describe("toVerifyOutcome", () => {
  it("maps Better Auth and guard codes", () => {
    expect(toVerifyOutcome({})).toEqual({ kind: "ok" });
    expect(toVerifyOutcome({ error: { code: "INVALID_OTP", status: 400 } })).toEqual({
      kind: "wrong",
    });
    expect(toVerifyOutcome({ error: { code: "TOO_MANY_ATTEMPTS", status: 403 } })).toEqual({
      kind: "locked",
    });
    expect(toVerifyOutcome({ error: { code: "OTP_EXPIRED", status: 400 } })).toEqual({
      kind: "expired",
    });
    expect(toVerifyOutcome({ error: { code: "OTP_VERIFY_LIMIT", status: 429 } })).toEqual({
      kind: "error",
      error: "verifyLimit",
    });
    expect(toVerifyOutcome({ error: { status: 0 } })).toEqual({ kind: "error", error: "network" });
  });
});
