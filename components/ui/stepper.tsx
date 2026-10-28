import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  /** Called with the index of a completed step the user picked. */
  onSelect: (index: number) => void;
  /** True while submitting: nothing can change step. */
  locked?: boolean;
}

export function Stepper({ steps, currentStep, onSelect, locked = false }: StepperProps) {
  const { t } = useTranslation("projectSubmit");
  const total = steps.length;
  const current = steps[currentStep];

  return (
    <nav aria-label={t("steps.navLabel")} className="w-full">
      <p className="mb-3 text-sm font-medium text-muted-foreground sm:hidden" aria-hidden="true">
        {t("steps.mobileLabel", { n: currentStep + 1, total, name: current?.title ?? "" })}
      </p>
      <ol className="flex w-full items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const state = isCurrent
            ? t("steps.current")
            : isCompleted
              ? t("steps.completed")
              : t("steps.notStarted");
          const srLabel = t("steps.srLabel", { n: index + 1, total, name: step.title, state });
          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none",
                isCompleted && "bg-primary/15 text-foreground",
                isCurrent && "bg-primary text-primary-foreground",
                !isCompleted && !isCurrent && "border bg-background text-muted-foreground",
              )}
            >
              {isCompleted ? <Check className="size-4" /> : index + 1}
            </span>
          );
          const label = (
            <span
              aria-hidden="true"
              className={cn(
                "hidden text-sm sm:block",
                isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.title}
            </span>
          );

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={cn("flex items-center", index < total - 1 && "flex-1")}
            >
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  disabled={locked}
                  className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 rounded-lg px-2 transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed"
                >
                  {circle}
                  {label}
                  <span className="sr-only">{srLabel}</span>
                </button>
              ) : (
                <span className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5">
                  {circle}
                  {label}
                  <span className="sr-only">{srLabel}</span>
                </span>
              )}
              {index < total - 1 && (
                <span
                  aria-hidden="true"
                  className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mb-6"
                >
                  <span
                    className={cn(
                      "absolute inset-0 origin-left bg-primary transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                      isCompleted ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
