import { Check, CircleAlert, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FieldMessageTone = "error" | "success" | "hint" | "info" | "loading";

/** One line under a field. Errors are `role="alert"`; the rest are polite. */
export function FieldMessage({
  id,
  tone,
  children,
}: {
  id: string;
  tone: FieldMessageTone;
  children: ReactNode;
}) {
  const isError = tone === "error";
  return (
    <p
      id={id}
      role={isError ? "alert" : undefined}
      aria-live={isError ? undefined : "polite"}
      className={cn(
        "mt-2 flex animate-auth-message-in gap-2 text-sm leading-5",
        isError && "text-destructive",
        (tone === "success" || tone === "info") && "text-foreground",
        (tone === "hint" || tone === "loading") && "text-muted-foreground",
      )}
    >
      {isError ? <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
      {tone === "success" ? (
        <Check
          className="mt-0.5 size-4 shrink-0 text-foreground dark:text-primary"
          aria-hidden="true"
        />
      ) : null}
      {tone === "loading" ? (
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </p>
  );
}
