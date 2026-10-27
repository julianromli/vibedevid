"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UsernameState, useUsernameClaim } from "@/hooks/use-username-claim";
import { USERNAME_MAX_LENGTH, type UsernameError } from "@/lib/username";
import { cn } from "@/lib/utils";
import {
  AuthHeading,
  AuthLogo,
  AuthSubtitle,
  authInputClassName,
  authPrimaryButtonClassName,
} from "./auth-card";
import { FieldMessage, type FieldMessageTone } from "./field-message";

const MESSAGE_ID = "username-message";

const ERROR_KEY: Record<UsernameError, string> = {
  required: "errors.usernameLength",
  too_short: "errors.usernameLength",
  too_long: "errors.usernameLength",
  invalid_chars: "errors.usernameFormat",
  reserved: "errors.usernameReserved",
};

function useMessage(
  state: UsernameState,
  saveError: "generic" | null,
): { tone: FieldMessageTone; text: string } {
  const { t } = useTranslation("auth");
  if (saveError) return { tone: "error", text: t("errors.generic") };
  switch (state.kind) {
    case "hint":
      return { tone: "hint", text: t("username.hint") };
    case "invalid":
      return { tone: "error", text: t(ERROR_KEY[state.error]) };
    case "checking":
      return { tone: "hint", text: t("username.checking") };
    case "available":
      return {
        tone: "success",
        text: t("username.available", { url: `vibedeveloper.id/${state.username}` }),
      };
    case "taken":
      return { tone: "error", text: t("errors.usernameTaken", { username: state.username }) };
    case "reserved":
      return { tone: "error", text: t("errors.usernameReserved", { username: state.username }) };
    case "checkFailed":
      return { tone: "error", text: t("errors.usernameCheckFailed") };
  }
}

export function UsernameClaim({
  initialUsername,
  onClaimed,
  onSignOut,
}: {
  initialUsername: string;
  onClaimed: () => void;
  onSignOut: () => void;
}) {
  const { t } = useTranslation("auth");
  const inputRef = useRef<HTMLInputElement>(null);
  const claim = useUsernameClaim({ initialUsername, onClaimed });
  const message = useMessage(claim.state, claim.saveError);
  const suggestions =
    claim.state.kind === "taken" || claim.state.kind === "reserved"
      ? claim.state.suggestions.slice(0, 3)
      : [];
  const isError = message.tone === "error";

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  return (
    <div className="animate-auth-step-in">
      <AuthLogo />
      <AuthHeading>{t("username.title")}</AuthHeading>
      <AuthSubtitle>{t("username.subtitle")}</AuthSubtitle>

      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const done = await claim.submit();
          if (!done) inputRef.current?.focus();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium">
            {t("username.label")}
          </Label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base text-muted-foreground"
            >
              @
            </span>
            <Input
              ref={inputRef}
              id="username"
              name="username"
              // A new handle, not a saved login: keep autofill and password managers out.
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              maxLength={USERNAME_MAX_LENGTH}
              enterKeyHint="done"
              value={claim.username}
              readOnly={claim.saving}
              onChange={(event) => {
                const { selectionStart } = event.target;
                claim.change(event.target.value);
                // Keep the caret where it was after lowercasing.
                requestAnimationFrame(() => {
                  if (selectionStart !== null)
                    inputRef.current?.setSelectionRange(selectionStart, selectionStart);
                });
              }}
              onBlur={claim.blur}
              aria-invalid={isError || undefined}
              aria-describedby={MESSAGE_ID}
              className={cn(authInputClassName, "pr-11 pl-9")}
            />
            <span
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
              aria-hidden="true"
            >
              {claim.state.kind === "checking" ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : claim.state.kind === "available" ? (
                <Check className="size-4 text-foreground dark:text-primary" />
              ) : null}
            </span>
          </div>
          <FieldMessage
            key={`${message.tone}:${message.text}`}
            id={MESSAGE_ID}
            tone={
              message.tone === "hint" && claim.state.kind === "checking" ? "hint" : message.tone
            }
          >
            {message.text}
          </FieldMessage>
        </div>

        {suggestions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("username.suggestions")}</span>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="relative h-9 rounded-full after:absolute after:-inset-1"
                onClick={() => {
                  claim.pickSuggestion(suggestion);
                  inputRef.current?.focus();
                }}
              >
                @{suggestion}
              </Button>
            ))}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={claim.saving}
          aria-busy={claim.saving || undefined}
          className={authPrimaryButtonClassName}
        >
          {claim.saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("username.saving")}
            </>
          ) : (
            t("username.submit")
          )}
        </Button>
      </form>

      <div className="mt-2 text-center">
        <Button
          type="button"
          variant="link"
          className="min-h-11 text-sm text-muted-foreground"
          onClick={onSignOut}
          disabled={claim.saving}
        >
          {t("username.signOut")}
        </Button>
      </div>
    </div>
  );
}
