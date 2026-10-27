import { OTP_CONFIG } from "@/lib/auth/otp-config";

/** Pending sign-in kept across refresh. Never in the URL: the email is PII. */
export const OTP_PENDING_STORAGE_KEY = "vd-otp-pending";

export type OtpPending = { email: string; sentAt: string; wrongAttempts: number };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readOtpPending(storage: StorageLike | null | undefined): OtpPending | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(OTP_PENDING_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<OtpPending>;
    if (typeof value.email !== "string" || typeof value.sentAt !== "string") return null;
    if (Number.isNaN(Date.parse(value.sentAt))) return null;
    const wrongAttempts =
      typeof value.wrongAttempts === "number" && value.wrongAttempts >= 0 ? value.wrongAttempts : 0;
    return { email: value.email, sentAt: value.sentAt, wrongAttempts };
  } catch {
    return null;
  }
}

export function writeOtpPending(
  storage: StorageLike | null | undefined,
  pending: OtpPending,
): void {
  try {
    storage?.setItem(OTP_PENDING_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Private mode or full storage: the flow still works until refresh.
  }
}

export function clearOtpPending(storage: StorageLike | null | undefined): void {
  try {
    storage?.removeItem(OTP_PENDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isOtpPendingExpired(pending: OtpPending, now = Date.now()): boolean {
  return now >= Date.parse(pending.sentAt) + OTP_CONFIG.expiresInSeconds * 1000;
}

/** Seconds until resend is allowed, from the stored send time (survives refresh and tab sleep). */
export function resendSecondsLeft(sentAt: string | null | undefined, now = Date.now()): number {
  if (!sentAt) return 0;
  const sent = Date.parse(sentAt);
  if (Number.isNaN(sent)) return 0;
  const left = Math.ceil((sent + OTP_CONFIG.resendCooldownSeconds * 1000 - now) / 1000);
  return Math.min(Math.max(left, 0), OTP_CONFIG.resendCooldownSeconds);
}

/** When the server reports a cooldown, back out the send time from the seconds left. */
export function sentAtFromRetryAfter(retryAfterSeconds: number, now = Date.now()): string {
  const left = Math.min(Math.max(retryAfterSeconds, 0), OTP_CONFIG.resendCooldownSeconds);
  return new Date(now - (OTP_CONFIG.resendCooldownSeconds - left) * 1000).toISOString();
}

/** `m:ss`, e.g. 42 -> "0:42". */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function attemptsLeft(wrongAttempts: number): number {
  return Math.max(OTP_CONFIG.allowedAttempts - wrongAttempts, 0);
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

/** Format only. The domain allowlist applies to new accounts, which only the server knows. */
export function isEmailFormatValid(value: string): boolean {
  return EMAIL_FORMAT.test(normalizeEmailInput(value));
}

export type SendOutcome =
  | { kind: "sent"; sentAt: string }
  | { kind: "cooldown"; sentAt: string }
  | {
      kind: "error";
      error: "emailFormat" | "emailDomain" | "sendLimit" | "network" | "generic";
      domain?: string;
    };

export type AuthApiError = {
  code?: string;
  status?: number;
  message?: string;
  domain?: string | null;
  retryAfterSeconds?: number;
};

/** Maps the send-OTP response to what the email step shows. */
export function toSendOutcome(
  result: { data?: { sentAt?: string } | null; error?: AuthApiError | null },
  now = Date.now(),
): SendOutcome {
  const error = result.error;
  if (!error) {
    const sentAt = result.data?.sentAt;
    return {
      kind: "sent",
      sentAt: sentAt && !Number.isNaN(Date.parse(sentAt)) ? sentAt : new Date(now).toISOString(),
    };
  }
  switch (error.code) {
    case "OTP_RESEND_COOLDOWN":
      return {
        kind: "cooldown",
        sentAt: sentAtFromRetryAfter(
          error.retryAfterSeconds ?? OTP_CONFIG.resendCooldownSeconds,
          now,
        ),
      };
    case "INVALID_EMAIL":
      return { kind: "error", error: "emailFormat" };
    case "EMAIL_DOMAIN_NOT_ALLOWED":
      return { kind: "error", error: "emailDomain", domain: error.domain ?? undefined };
    case "OTP_SEND_LIMIT":
      return { kind: "error", error: "sendLimit" };
    default:
      return { kind: "error", error: isNetworkError(error) ? "network" : "generic" };
  }
}

export type VerifyOutcome =
  | { kind: "ok" }
  | { kind: "wrong" }
  | { kind: "locked" }
  | { kind: "expired" }
  | { kind: "error"; error: "verifyLimit" | "network" | "generic" };

export function toVerifyOutcome(result: { error?: AuthApiError | null }): VerifyOutcome {
  const error = result.error;
  if (!error) return { kind: "ok" };
  switch (error.code) {
    case "INVALID_OTP":
      return { kind: "wrong" };
    case "TOO_MANY_ATTEMPTS":
      return { kind: "locked" };
    case "OTP_EXPIRED":
      return { kind: "expired" };
    case "OTP_VERIFY_LIMIT":
      return { kind: "error", error: "verifyLimit" };
    default:
      return { kind: "error", error: isNetworkError(error) ? "network" : "generic" };
  }
}

/** better-fetch reports a failed fetch with status 0 (or no status). */
function isNetworkError(error: AuthApiError): boolean {
  return !error.status;
}
