"use client";

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import {
  type AuthApiError,
  attemptsLeft,
  clearOtpPending,
  isEmailFormatValid,
  isOtpPendingExpired,
  normalizeEmailInput,
  type OtpPending,
  readOtpPending,
  resendSecondsLeft,
  toSendOutcome,
  toVerifyOutcome,
  writeOtpPending,
} from "@/lib/auth/otp-flow";
import { getSafeRedirectPath } from "@/lib/auth/redirect-path";

export type EmailError =
  | { key: "emailFormat" }
  | { key: "emailDomain"; domain: string }
  | { key: "sendLimit" }
  | { key: "network" }
  | { key: "generic" }
  | { key: "codeExpiredBody" };

export type CodeStatus = "idle" | "verifying" | "wrong" | "locked" | "expired";

export type CodeMessage =
  | { kind: "error"; key: "codeIncomplete" | "verifyLimit" | "network" | "generic" | "sendLimit" }
  | { kind: "error"; key: "codeWrong"; count: number }
  | { kind: "info"; key: "resent" | "alreadySent" };

type Step = "email" | "code";

function sessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** better-fetch returns `{ data, error }`; a thrown fetch means the network failed. */
async function callAuth<T>(
  request: () => Promise<{ data?: T | null; error?: AuthApiError | null }>,
) {
  try {
    return await request();
  } catch {
    return { data: null, error: { status: 0 } satisfies AuthApiError };
  }
}

export function useEmailOtpFlow(input: { step?: "code"; redirectTo?: string }) {
  const navigate = useNavigate();
  const redirectTo = getSafeRedirectPath(input.redirectTo);
  const step: Step = input.step === "code" ? "code" : "email";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<EmailError | null>(null);
  const [sending, setSending] = useState(false);

  const [pending, setPending] = useState<OtpPending | null>(null);
  const [code, setCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<CodeStatus>("idle");
  const [codeMessage, setCodeMessage] = useState<CodeMessage | null>(null);
  const [resending, setResending] = useState(false);
  const [sendLimited, setSendLimited] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef(false);

  const goToStep = useCallback(
    (next: Step, options?: { replace?: boolean }) => {
      void navigate({
        to: "/user/auth",
        search: { redirectTo: input.redirectTo, step: next === "code" ? "code" : undefined },
        replace: options?.replace,
      });
    },
    [navigate, input.redirectTo],
  );

  const savePending = useCallback((next: OtpPending | null) => {
    setPending(next);
    if (next) writeOtpPending(sessionStore(), next);
    else clearOtpPending(sessionStore());
  }, []);

  // Restore after refresh, or after browser Back/Forward between steps.
  useEffect(() => {
    const stored = readOtpPending(sessionStore());
    if (stored && !email) setEmail(stored.email);
    if (step !== "code") return;
    if (!stored || isOtpPendingExpired(stored)) {
      if (stored) clearOtpPending(sessionStore());
      setEmailError({ key: "codeExpiredBody" });
      goToStep("email", { replace: true });
      return;
    }
    setPending(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the step changes only
  }, [step]);

  // Resend countdown ticks from the stored send time, not a decrementing counter.
  const secondsLeft = resendSecondsLeft(pending?.sentAt, now);
  useEffect(() => {
    if (step !== "code" || !pending) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [step, pending]);

  const startCode = useCallback(
    (nextEmail: string, sentAt: string, message: CodeMessage | null) => {
      savePending({ email: nextEmail, sentAt, wrongAttempts: 0 });
      setCode("");
      setCodeStatus("idle");
      setCodeMessage(message);
      setSendLimited(false);
      setNow(Date.now());
    },
    [savePending],
  );

  const changeEmail = useCallback(
    (value: string) => {
      setEmail(value);
      // Live validation only after an error has been shown.
      if (emailError) setEmailError(isEmailFormatValid(value) ? null : { key: "emailFormat" });
    },
    [emailError],
  );

  const submitEmail = useCallback(async () => {
    if (sending) return false;
    const normalized = normalizeEmailInput(email);
    setEmail(normalized);
    if (!isEmailFormatValid(normalized)) {
      setEmailError({ key: "emailFormat" });
      return false;
    }
    setEmailError(null);

    // Same email still in cooldown: the code already went out.
    const stored = readOtpPending(sessionStore());
    if (
      stored &&
      stored.email === normalized &&
      !isOtpPendingExpired(stored) &&
      resendSecondsLeft(stored.sentAt) > 0
    ) {
      setPending(stored);
      setCode("");
      setCodeStatus("idle");
      setCodeMessage({ kind: "info", key: "alreadySent" });
      goToStep("code");
      return true;
    }

    setSending(true);
    const result = await callAuth(
      () =>
        authClient.emailOtp.sendVerificationOtp({ email: normalized, type: "sign-in" }) as Promise<{
          data?: { sentAt?: string } | null;
          error?: AuthApiError | null;
        }>,
    );
    setSending(false);

    const outcome = toSendOutcome(result);
    if (outcome.kind === "error") {
      setEmailError(
        outcome.error === "emailDomain"
          ? { key: "emailDomain", domain: outcome.domain ?? "" }
          : { key: outcome.error },
      );
      return false;
    }
    startCode(
      normalized,
      outcome.sentAt,
      outcome.kind === "cooldown" ? { kind: "info", key: "alreadySent" } : null,
    );
    goToStep("code");
    return true;
  }, [email, sending, goToStep, startCode]);

  const resend = useCallback(async () => {
    if (!pending || resending) return false;
    setResending(true);
    const result = await callAuth(
      () =>
        authClient.emailOtp.sendVerificationOtp({
          email: pending.email,
          type: "sign-in",
        }) as Promise<{
          data?: { sentAt?: string } | null;
          error?: AuthApiError | null;
        }>,
    );
    setResending(false);

    const outcome = toSendOutcome(result);
    if (outcome.kind === "sent") {
      startCode(pending.email, outcome.sentAt, { kind: "info", key: "resent" });
      return true;
    }
    if (outcome.kind === "cooldown") {
      savePending({ ...pending, sentAt: outcome.sentAt });
      setNow(Date.now());
      return false;
    }
    if (outcome.error === "sendLimit") {
      setSendLimited(true);
      setCodeMessage({ kind: "error", key: "sendLimit" });
    } else {
      setCodeMessage({ kind: "error", key: outcome.error === "network" ? "network" : "generic" });
    }
    return false;
  }, [pending, resending, savePending, startCode]);

  const changeCode = useCallback(
    (value: string) => {
      setCode(value);
      if (codeStatus === "wrong") setCodeStatus("idle");
      if (codeMessage?.kind === "error" && codeMessage.key === "codeIncomplete")
        setCodeMessage(null);
    },
    [codeStatus, codeMessage],
  );

  /** Returns "incomplete" so the view can focus the first empty slot. */
  const verify = useCallback(
    async (value = code): Promise<"ok" | "incomplete" | "failed"> => {
      if (!pending || inFlight.current) return "failed";
      if (codeStatus === "locked" || codeStatus === "expired") return "failed";
      if (value.length !== 6) {
        setCodeMessage({ kind: "error", key: "codeIncomplete" });
        return "incomplete";
      }

      inFlight.current = true;
      setCodeStatus("verifying");
      setCodeMessage(null);
      const result = await callAuth(() =>
        authClient.signIn.emailOtp({ email: pending.email, otp: value }),
      );
      inFlight.current = false;

      const outcome = toVerifyOutcome(result);
      switch (outcome.kind) {
        case "ok":
          clearOtpPending(sessionStore());
          // Full load so the server gate can send new accounts to onboarding.
          window.location.assign(redirectTo);
          return "ok";
        case "wrong": {
          const wrongAttempts = pending.wrongAttempts + 1;
          savePending({ ...pending, wrongAttempts });
          setCode("");
          const left = attemptsLeft(wrongAttempts);
          if (left === 0) {
            setCodeStatus("locked");
            setCodeMessage(null);
            return "failed";
          }
          setCodeStatus("wrong");
          setCodeMessage({ kind: "error", key: "codeWrong", count: left });
          return "failed";
        }
        case "locked":
          setCode("");
          setCodeMessage(null);
          setCodeStatus("locked");
          return "failed";
        case "expired":
          setCode("");
          setCodeMessage(null);
          setCodeStatus("expired");
          return "failed";
        case "error":
          setCodeStatus("idle");
          setCodeMessage({ kind: "error", key: outcome.error });
          return "failed";
      }
    },
    [code, codeStatus, pending, redirectTo, savePending],
  );

  const backToEmail = useCallback(() => {
    if (pending) setEmail(pending.email);
    setEmailError(null);
    goToStep("email");
  }, [pending, goToStep]);

  return {
    step,
    redirectTo,
    email,
    emailError,
    sending,
    changeEmail,
    submitEmail,
    pendingEmail: pending?.email ?? null,
    code,
    codeStatus,
    codeMessage,
    changeCode,
    verify,
    resend,
    resending,
    sendLimited,
    secondsLeft,
    lastNetworkError: codeMessage?.kind === "error" && codeMessage.key === "network",
    backToEmail,
  };
}
