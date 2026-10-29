"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import type { CodeMessage, CodeStatus } from "@/hooks/use-email-otp-flow";
import { OTP_CONFIG } from "@/lib/auth/otp-config";
import { formatCountdown } from "@/lib/auth/otp-flow";
import { cn } from "@/lib/utils";
import {
  AuthHeading,
  AuthSubtitle,
  authPrimaryButtonClassName,
  authWaitingButtonClassName,
} from "./auth-card";
import { FieldMessage } from "./field-message";

const MESSAGE_ID = "code-message";
const MINUTES = OTP_CONFIG.expiresInSeconds / 60;
const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(-2px)" },
  { transform: "translateX(0)" },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: existing function over the limit; split it in its own refactor
export function OtpStep({
  email,
  code,
  status,
  message,
  secondsLeft,
  resending,
  sendLimited,
  onChange,
  onVerify,
  onResend,
}: {
  email: string;
  code: string;
  status: CodeStatus;
  message: CodeMessage | null;
  secondsLeft: number;
  resending: boolean;
  sendLimited: boolean;
  onChange: (value: string) => void;
  onVerify: (value?: string) => Promise<"ok" | "incomplete" | "failed">;
  onResend: () => Promise<boolean>;
}) {
  const { t } = useTranslation("auth");
  const inputRef = useRef<HTMLInputElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const blocked = status === "locked" || status === "expired";
  const verifying = status === "verifying";
  const wrong = status === "wrong";
  const waiting = blocked && secondsLeft > 0;
  const shakeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Wrong code or a fresh code: focus slot 1. Blocked: focus the primary button.
  // The shake runs on the wrapper through the Web Animations API so the input is
  // never remounted (a remount drops the focus we just set).
  useEffect(() => {
    if (!wrong) return;
    inputRef.current?.focus();
    const node = shakeRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.animate(SHAKE_KEYFRAMES, { duration: 240, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }, [wrong]);
  useEffect(() => {
    if (blocked) primaryRef.current?.focus();
  }, [blocked]);
  useEffect(() => {
    if (message?.kind === "info" && message.key === "resent") inputRef.current?.focus();
  }, [message]);

  // Live region speaks only at the start and end of the cooldown, not every second.
  const [cooldownAnnouncement, setCooldownAnnouncement] = useState("");
  const coolingDown = secondsLeft > 0;
  const wasCooling = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: announce only on the cooldown edge, not every tick
  useEffect(() => {
    if (coolingDown && !wasCooling.current) {
      setCooldownAnnouncement(t("code.cooldownStart", { seconds: secondsLeft }));
    } else if (!coolingDown && wasCooling.current) {
      setCooldownAnnouncement(t("code.cooldownEnd"));
    }
    wasCooling.current = coolingDown;
  }, [coolingDown]);

  const submit = async (value?: string) => {
    if (blocked) {
      if (secondsLeft === 0) await onResend();
      return;
    }
    const result = await onVerify(value);
    if (result === "incomplete") inputRef.current?.focus();
  };

  const networkError = message?.kind === "error" && message.key === "network";
  const messageText = !message
    ? null
    : message.kind === "info"
      ? t(`code.${message.key}`)
      : message.key === "codeWrong"
        ? t("errors.codeWrong", { count: message.count })
        : t(`errors.${message.key}`);

  const primaryLabel = blocked
    ? secondsLeft > 0
      ? t("code.resendIn", { time: formatCountdown(secondsLeft) })
      : t("code.newCode")
    : networkError
      ? t("common.retry")
      : t("code.submit");
  const primaryLoading = verifying || (blocked && resending);

  return (
    <div className="animate-auth-step-in">
      <AuthHeading>{t("code.title")}</AuthHeading>
      <AuthSubtitle>
        <Trans
          t={t}
          i18nKey="code.subtitle"
          values={{ email, minutes: MINUTES }}
          components={{ b: <span className="font-medium break-all text-foreground" /> }}
        />
      </AuthSubtitle>

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {blocked ? (
          <Alert
            variant="destructive"
            className="rounded-xl border-destructive/40 bg-destructive/10"
          >
            <AlertTitle className="text-sm font-medium">
              {t(status === "locked" ? "errors.codeLockedTitle" : "errors.codeExpiredTitle")}
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {status === "locked"
                ? t("errors.codeLockedBody")
                : t("errors.codeExpiredBody", { minutes: MINUTES })}
            </AlertDescription>
          </Alert>
        ) : null}

        <div>
          <Label htmlFor="code" className="sr-only">
            {t("code.label")}
          </Label>
          <div ref={shakeRef}>
            <InputOTP
              ref={inputRef}
              id="code"
              name="code"
              maxLength={OTP_CONFIG.length}
              pattern={REGEXP_ONLY_DIGITS}
              pasteTransformer={(pasted) => pasted.replace(/\D/g, "")}
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={onChange}
              onComplete={(value: string) => void submit(value)}
              disabled={verifying || blocked}
              aria-label={t("code.label")}
              aria-describedby={messageText ? MESSAGE_ID : undefined}
              aria-invalid={wrong || undefined}
              // Digits stay readable while the code is being checked.
              containerClassName={cn("justify-center", verifying && "has-disabled:opacity-100")}
            >
              <InputOTPGroup>
                {[0, 1, 2].map((index) => (
                  <InputOTPSlot key={index} index={index} invalid={wrong} />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} invalid={wrong} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {messageText ? (
            <FieldMessage id={MESSAGE_ID} tone={message?.kind === "info" ? "info" : "error"}>
              {messageText}
            </FieldMessage>
          ) : null}
        </div>

        <Button
          ref={primaryRef}
          type="submit"
          disabled={primaryLoading}
          aria-busy={primaryLoading || undefined}
          aria-disabled={waiting || undefined}
          className={cn(authPrimaryButtonClassName, waiting && authWaitingButtonClassName)}
        >
          {primaryLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {verifying ? t("code.verifying") : t("code.resending")}
            </>
          ) : (
            primaryLabel
          )}
        </Button>
      </form>

      {!blocked && !sendLimited ? (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t("code.noCode")}{" "}
          <Button
            type="button"
            variant="link"
            className="min-h-11 px-1 font-medium text-foreground tabular-nums"
            disabled={coolingDown || resending}
            aria-busy={resending || undefined}
            onClick={() => void onResend()}
          >
            {resending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t("code.resending")}
              </>
            ) : coolingDown ? (
              t("code.resendIn", { time: formatCountdown(secondsLeft) })
            ) : (
              t("code.resend")
            )}
          </Button>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {cooldownAnnouncement}
      </p>
    </div>
  );
}
