import { OTP_SEND_PATH, OTP_SIGN_IN_PATH } from "@/lib/auth/otp-config";
import { newAccountEmailError } from "@/lib/auth/email-domain";
import {
  type ConsumeRateLimit,
  checkOtpSendAllowed,
  checkOtpVerifyAllowed,
} from "@/lib/auth/otp-guards";

export type OtpGuardError = {
  status: "BAD_REQUEST" | "TOO_MANY_REQUESTS" | "SERVICE_UNAVAILABLE";
  code: string;
  message: string;
  retryAfterSeconds?: number;
  domain?: string;
};

type GuardInput = {
  path: string | undefined;
  body: unknown;
  ip: string;
  emailConfigured: boolean;
  userExists: (email: string) => Promise<boolean>;
  consume: ConsumeRateLimit;
};

function readString(body: unknown, key: string): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Checks Better Auth OTP requests before the endpoint runs.
 * Send: email delivery configured, allowlist for new accounts, cooldown and caps.
 * Sign-in: per-IP cap on code checks.
 * Returns null when the request may continue.
 */
export async function guardOtpRequest(input: GuardInput): Promise<OtpGuardError | null> {
  if (input.path === OTP_SEND_PATH) {
    const type = readString(input.body, "type");
    if (type !== "sign-in") {
      return {
        status: "BAD_REQUEST",
        code: "OTP_TYPE_NOT_ALLOWED",
        message: "Only sign-in codes are supported.",
      };
    }
    if (!input.emailConfigured) {
      return {
        status: "SERVICE_UNAVAILABLE",
        code: "EMAIL_NOT_CONFIGURED",
        message: "Email delivery is not configured.",
      };
    }

    const email = readString(input.body, "email")?.trim().toLowerCase() ?? "";
    const domainError = newAccountEmailError(email, {
      existingUser: await input.userExists(email),
    });
    if (domainError?.code === "INVALID_EMAIL") {
      return { status: "BAD_REQUEST", code: "INVALID_EMAIL", message: "Invalid email." };
    }
    if (domainError) {
      return {
        status: "BAD_REQUEST",
        code: "EMAIL_DOMAIN_NOT_ALLOWED",
        message: `Domain ${domainError.domain} is not allowed for new accounts.`,
        domain: domainError.domain,
      };
    }

    const limited = await checkOtpSendAllowed({ email, ip: input.ip, consume: input.consume });
    if (limited) {
      return {
        status: "TOO_MANY_REQUESTS",
        code: limited.code,
        message: "Too many code requests. Try again later.",
        retryAfterSeconds: limited.retryAfterSeconds,
      };
    }
    return null;
  }

  if (input.path === OTP_SIGN_IN_PATH) {
    const limited = await checkOtpVerifyAllowed({ ip: input.ip, consume: input.consume });
    if (limited) {
      return {
        status: "TOO_MANY_REQUESTS",
        code: limited.code,
        message: "Too many attempts. Try again later.",
        retryAfterSeconds: limited.retryAfterSeconds,
      };
    }
  }

  return null;
}
