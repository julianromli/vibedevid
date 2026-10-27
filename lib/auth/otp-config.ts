import type { EmailOTPOptions } from "better-auth/plugins/email-otp";

/** Sign-in OTP rules. One place so the server, UI and tests agree. */
export const OTP_CONFIG = {
  length: 6,
  expiresInSeconds: 600,
  allowedAttempts: 5,
  resendCooldownSeconds: 60,
} as const;

/** Fixed-window limits stored in `rate_limit_buckets`. */
export const OTP_RATE_LIMITS = {
  resendCooldown: { limit: 1, windowMs: OTP_CONFIG.resendCooldownSeconds * 1000 },
  sendPerEmail: { limit: 5, windowMs: 60 * 60 * 1000 },
  sendPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  verifyPerIp: { limit: 30, windowMs: 10 * 60 * 1000 },
} as const;

export const OTP_SEND_PATH = "/email-otp/send-verification-otp";
export const OTP_SIGN_IN_PATH = "/sign-in/email-otp";

// Largest multiple of 10 below 2^32, so `value % 10` has no bias.
const UNBIASED_LIMIT = 4_294_967_290;

function generateNumericOtp(length: number): string {
  let otp = "";
  const buffer = new Uint32Array(length);
  while (otp.length < length) {
    crypto.getRandomValues(buffer);
    for (const value of buffer) {
      if (value < UNBIASED_LIMIT && otp.length < length) otp += String(value % 10);
    }
  }
  return otp;
}

export function buildEmailOtpOptions(
  sendVerificationOTP: EmailOTPOptions["sendVerificationOTP"],
): EmailOTPOptions {
  return {
    otpLength: OTP_CONFIG.length,
    expiresIn: OTP_CONFIG.expiresInSeconds,
    allowedAttempts: OTP_CONFIG.allowedAttempts,
    // Sign-in creates the account when the email is new.
    disableSignUp: false,
    sendVerificationOnSignUp: false,
    storeOTP: "hashed",
    generateOTP: () => generateNumericOtp(OTP_CONFIG.length),
    // Better Auth's own limiter keeps per-isolate memory on Workers. Our
    // Neon-backed limits in `otp-guards.ts` are the real ones; this is a
    // loose backstop that stays above the per-code attempt limit.
    rateLimit: { window: 60, max: 10 },
    sendVerificationOTP,
  };
}
