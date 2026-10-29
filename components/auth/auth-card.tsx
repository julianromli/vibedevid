"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

/** Shared shell for /user/auth and /user/onboarding. */
export function AuthCard({
  children,
  onBack,
  backLabel,
  showClose = true,
}: {
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  showClose?: boolean;
}) {
  const { t } = useTranslation("auth");
  return (
    <div className="relative grid min-h-dvh place-items-center bg-grid-pattern px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      <div className="relative w-full max-w-[400px] rounded-3xl border bg-background/80 p-6 backdrop-blur-xl sm:p-8">
        <div className="-mx-2 -mt-2 mb-4 flex items-center justify-between">
          <div>
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                onClick={onBack}
                aria-label={backLabel ?? t("common.back")}
              >
                <ArrowLeft className="size-5" />
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle className="size-11 rounded-full" />
            {showClose ? (
              <Button asChild variant="ghost" size="icon" className="size-11 rounded-full">
                <Link to="/" aria-label={t("common.close")}>
                  <X className="size-5" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthLogo() {
  return (
    <div className="mb-5" aria-hidden="true">
      <img
        src="/V_vibedevid_black.svg"
        alt=""
        width={28}
        height={28}
        className="block h-auto w-7 dark:hidden"
      />
      <img
        src="/V_vibedevid_white.svg"
        alt=""
        width={28}
        height={28}
        className="hidden h-auto w-7 dark:block"
      />
    </div>
  );
}

export function AuthHeading({
  id,
  children,
  focusOnMount = false,
}: {
  id?: string;
  children: ReactNode;
  focusOnMount?: boolean;
}) {
  return (
    <h1
      id={id}
      tabIndex={-1}
      ref={(node) => {
        if (node && focusOnMount) node.focus();
      }}
      className="text-2xl leading-8 font-semibold tracking-[-0.035em] outline-none"
    >
      {children}
    </h1>
  );
}

export function AuthSubtitle({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-[22px] text-muted-foreground">{children}</p>;
}

export { authInputClassName, authPrimaryButtonClassName } from "@/components/ui/form-classes";

/** Primary button while a countdown runs: focusable, `aria-disabled`, visibly waiting. */
export const authWaitingButtonClassName =
  "bg-muted text-muted-foreground tabular-nums hover:bg-muted active:scale-100";

export function stepClassName(className?: string) {
  return cn("animate-auth-step-in", className);
}
