import { describe, expect, it, vi } from "vite-plus/test";
import { buildEmailOtpOptions, OTP_CONFIG } from "@/lib/auth/otp-config";

describe("OTP config", () => {
  it("uses 6 digits, 10 minutes, 5 attempts and a 60s resend cooldown", () => {
    expect(OTP_CONFIG).toEqual({
      length: 6,
      expiresInSeconds: 600,
      allowedAttempts: 5,
      resendCooldownSeconds: 60,
    });
  });

  it("maps to Better Auth emailOTP plugin options", async () => {
    const send = vi.fn(async () => {});
    const options = buildEmailOtpOptions(send);

    expect(options.otpLength).toBe(6);
    expect(options.expiresIn).toBe(600);
    expect(options.allowedAttempts).toBe(5);
    expect(options.disableSignUp).toBe(false);
    expect(options.storeOTP).toBe("hashed");
    expect(options.sendVerificationOnSignUp).toBe(false);

    await options.sendVerificationOTP({ email: "a@gmail.com", otp: "123456", type: "sign-in" });
    expect(send).toHaveBeenCalledOnce();
  });

  it("generates numeric codes of the configured length", () => {
    const options = buildEmailOtpOptions(async () => {});
    for (let i = 0; i < 20; i++) {
      const otp = options.generateOTP?.({ email: "a@gmail.com", type: "sign-in" });
      expect(otp).toMatch(/^\d{6}$/);
    }
  });
});
