import { OTP_RATE_LIMITS } from "@/lib/auth/otp-config";

/** Same contract as `consumeWindowedRateLimit`. */
export type ConsumeRateLimit = (
  bucket: string,
  limit: number,
  windowMs: number,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;

export type OtpLimitError = {
  code: "OTP_RESEND_COOLDOWN" | "OTP_SEND_LIMIT" | "OTP_VERIFY_LIMIT";
  retryAfterSeconds: number;
};

function blocked(code: OtpLimitError["code"], retryAfterSeconds: number): OtpLimitError {
  return { code, retryAfterSeconds };
}

/** Resend cooldown, then hourly caps per email and per IP. Returns null when allowed. */
export async function checkOtpSendAllowed(input: {
  email: string;
  ip: string;
  consume: ConsumeRateLimit;
}): Promise<OtpLimitError | null> {
  const email = input.email.trim().toLowerCase();
  const { resendCooldown, sendPerEmail, sendPerIp } = OTP_RATE_LIMITS;

  const cooldown = await input.consume(
    `otp-cooldown:${email}`,
    resendCooldown.limit,
    resendCooldown.windowMs,
  );
  if (!cooldown.allowed) return blocked("OTP_RESEND_COOLDOWN", cooldown.retryAfterSeconds);

  const perEmail = await input.consume(
    `otp-send-email:${email}`,
    sendPerEmail.limit,
    sendPerEmail.windowMs,
  );
  if (!perEmail.allowed) return blocked("OTP_SEND_LIMIT", perEmail.retryAfterSeconds);

  const perIp = await input.consume(`otp-send-ip:${input.ip}`, sendPerIp.limit, sendPerIp.windowMs);
  if (!perIp.allowed) return blocked("OTP_SEND_LIMIT", perIp.retryAfterSeconds);

  return null;
}

/** Per-IP cap on code checks. The per-code attempt limit lives in Better Auth. */
export async function checkOtpVerifyAllowed(input: {
  ip: string;
  consume: ConsumeRateLimit;
}): Promise<OtpLimitError | null> {
  const { verifyPerIp } = OTP_RATE_LIMITS;
  const perIp = await input.consume(
    `otp-verify-ip:${input.ip}`,
    verifyPerIp.limit,
    verifyPerIp.windowMs,
  );
  return perIp.allowed ? null : blocked("OTP_VERIFY_LIMIT", perIp.retryAfterSeconds);
}
