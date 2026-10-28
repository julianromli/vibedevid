import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { authInputClassName } from "@/components/ui/form-classes";
import { Input } from "@/components/ui/input";
import { FieldFooter, FieldLabel, hintId } from "@/components/ui/submit-project-form/field-parts";
import { cn } from "@/lib/utils";

export interface SourceStepProps {
  githubRepoUrl: string;
  setGithubRepoUrl: (value: string) => void;
  disabled: boolean;
  isImporting: boolean;
  importError: string | null;
  onImport: () => void;
  onSkip: () => void;
}

export function SourceStep({
  githubRepoUrl,
  setGithubRepoUrl,
  disabled,
  isImporting,
  importError,
  onImport,
  onSkip,
}: SourceStepProps) {
  const { t } = useTranslation("projectSubmit");

  return (
    <div className="space-y-4" data-testid="github-import">
      <div>
        <FieldLabel htmlFor="github_repo">{t("form.importGithub")}</FieldLabel>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="github_repo"
            placeholder={t("form.importGithubPlaceholder")}
            className={cn(authInputClassName, "flex-1")}
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            onKeyDown={(e) => {
              // Enter here imports instead of moving to the next step.
              if (e.key === "Enter") {
                e.preventDefault();
                if (!disabled && !isImporting) onImport();
              }
            }}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            disabled={disabled || isImporting}
            aria-invalid={importError ? true : undefined}
            aria-describedby={
              importError ? `${hintId("github_repo")} github_repo-error` : hintId("github_repo")
            }
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onImport}
            disabled={disabled || isImporting}
            aria-busy={isImporting || undefined}
            className="h-12 rounded-xl px-5 text-base sm:min-w-28"
          >
            <span className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
              <span className={cn(isImporting && "invisible")}>{t("form.import")}</span>
              {isImporting && (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">{t("form.importing")}</span>
                </span>
              )}
            </span>
          </Button>
        </div>
        <FieldFooter
          field="github_repo"
          hint={t("form.importGithubHelper")}
          error={importError ?? undefined}
        />
      </div>
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {t("form.skipImport")}
      </button>
    </div>
  );
}
