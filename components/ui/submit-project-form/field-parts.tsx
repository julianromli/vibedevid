import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FieldMessage } from "@/components/auth/field-message";
import { Label } from "@/components/ui/label";
import type { ProjectFormFieldName } from "@/lib/project-submission";

/** One message per field, keyed by the wire field name. */
export type FieldErrors = Partial<Record<ProjectFormFieldName, string>>;

/** Props shared by the steps that own form fields. */
export interface FieldStepProps {
  errors: FieldErrors;
  onFieldBlur: (field: ProjectFormFieldName) => void;
  disabled: boolean;
}

export const errorId = (field: string) => `${field}-error`;
export const hintId = (field: string) => `${field}-hint`;

/** aria props that link a field to its hint and, when present, its error. */
export function fieldAria(field: ProjectFormFieldName, errors: FieldErrors, hasHint = true) {
  const error = errors[field];
  const ids = [hasHint ? hintId(field) : null, error ? errorId(field) : null].filter(Boolean);
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": ids.length > 0 ? ids.join(" ") : undefined,
  } as const;
}

export function FieldLabel({
  htmlFor,
  optional = false,
  children,
}: {
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation("projectSubmit");
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
      {optional && <span className="font-normal text-muted-foreground"> {t("form.optional")}</span>}
    </Label>
  );
}

/** Hint on the left, optional counter on the right, error below. */
export function FieldFooter({
  field,
  hint,
  error,
  counter,
}: {
  field: string;
  hint?: ReactNode;
  error?: string;
  counter?: ReactNode;
}) {
  return (
    <div>
      {(hint || counter) && (
        <div className="mt-2 flex items-start justify-between gap-4 text-sm text-muted-foreground">
          {hint ? <p id={hintId(field)}>{hint}</p> : <span />}
          {counter}
        </div>
      )}
      {error && (
        <FieldMessage id={errorId(field)} tone="error">
          {error}
        </FieldMessage>
      )}
    </div>
  );
}

/** Shows once the value passes 80% of the limit, so it only appears when it matters. */
export function CharCounter({ value, max }: { value: string; max: number }) {
  const { t } = useTranslation("projectSubmit");
  if (value.length < max * 0.8) return null;
  return (
    <span
      className={
        value.length > max
          ? "shrink-0 text-xs tabular-nums text-destructive"
          : "shrink-0 text-xs tabular-nums text-muted-foreground"
      }
    >
      {t("form.counter", { count: value.length, max })}
    </span>
  );
}
