"use client";

import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailError } from "@/hooks/use-email-otp-flow";
import { OTP_CONFIG } from "@/lib/auth/otp-config";
import { cn } from "@/lib/utils";
import {
  AuthHeading,
  AuthLogo,
  AuthSubtitle,
  authInputClassName,
  authPrimaryButtonClassName,
} from "./auth-card";
import { FieldMessage } from "./field-message";

const MESSAGE_ID = "email-message";

export function EmailStep({
  email,
  error,
  sending,
  onChange,
  onSubmit,
}: {
  email: string;
  error: EmailError | null;
  sending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => Promise<boolean>;
}) {
  const { t } = useTranslation("auth");
  const inputRef = useRef<HTMLInputElement>(null);

  // Desktop only: on touch the keyboard would cover the page. Coming back from
  // step 2 with an email, focus so it can be edited. type="email" inputs throw
  // on setSelectionRange, so only focus.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const cameBack = input.value.length > 0;
    if (!cameBack && !window.matchMedia("(pointer: fine)").matches) return;
    input.focus();
  }, []);

  const message = error
    ? error.key === "emailDomain"
      ? t("errors.emailDomain", { domain: error.domain })
      : error.key === "codeExpiredBody"
        ? t("errors.codeExpiredBody", { minutes: OTP_CONFIG.expiresInSeconds / 60 })
        : t(`errors.${error.key}`)
    : null;

  return (
    <div className="animate-auth-step-in">
      <AuthLogo />
      <AuthHeading>{t("email.title")}</AuthHeading>
      <AuthSubtitle>{t("email.subtitle")}</AuthSubtitle>

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await onSubmit();
          if (!ok) inputRef.current?.focus();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t("email.label")}
          </Label>
          <Input
            ref={inputRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="send"
            placeholder={t("email.placeholder")}
            value={email}
            readOnly={sending}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={error && error.key !== "codeExpiredBody" ? true : undefined}
            aria-describedby={message ? MESSAGE_ID : undefined}
            className={authInputClassName}
          />
          {message ? (
            <FieldMessage
              id={MESSAGE_ID}
              tone={error?.key === "codeExpiredBody" ? "info" : "error"}
            >
              {message}
            </FieldMessage>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={sending}
          aria-busy={sending || undefined}
          className={cn(authPrimaryButtonClassName)}
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("email.sending")}
            </>
          ) : (
            t("email.submit")
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Trans
          t={t}
          i18nKey="email.terms"
          components={{
            link: <Link to="/terms-of-service" className="underline underline-offset-2" />,
          }}
        />
      </p>
    </div>
  );
}
