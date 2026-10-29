"use client";

import { Loader2 } from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { authPrimaryButtonClassName } from "@/components/ui/form-classes";
import type { Option } from "@/components/ui/multiselect";
import { Stepper } from "@/components/ui/stepper";
import type { FieldErrors } from "@/components/ui/submit-project-form/field-parts";
import { BasicsStep } from "@/components/ui/submit-project-form/steps/basics-step";
import {
  LinksMediaStep,
  SCREENSHOTS_DROPZONE_ID,
  TAGS_FIELD_ID,
} from "@/components/ui/submit-project-form/steps/links-media-step";
import { ReviewStep } from "@/components/ui/submit-project-form/steps/review-step";
import { SourceStep } from "@/components/ui/submit-project-form/steps/source-step";
import { useScreenshotUploads } from "@/components/ui/submit-project-form/use-screenshot-uploads";
import { submitProjectFn } from "@/lib/actions/projects.functions";
import type { Category } from "@/lib/categories";
import type { GitHubImportErrorCode } from "@/lib/github-import";
import { useRouter } from "@/lib/navigation";
import {
  buildProjectFieldErrors,
  buildProjectSubmissionSchema,
  PROJECT_FORM_FIELDS,
  PROJECT_LIMITS,
  type ProjectFieldErrors,
  type ProjectFormFieldName,
  type ProjectSubmissionInput,
} from "@/lib/project-submission";
import { cn } from "@/lib/utils";

interface SubmitProjectFormProps {
  userId: string;
  categories: Category[];
}

interface GitHubImportData {
  title?: string;
  tagline?: string;
  description?: string;
  website_url?: string;
  favicon_url?: string;
  preview_image_url?: string;
  image_url?: string;
  tags?: string[];
  repo?: {
    name?: string;
    full_name?: string;
    html_url?: string;
    owner?: string;
  };
}

type StepIndex = 0 | 1 | 2 | 3;

const STEP_IDS = ["source", "basics", "linksMedia", "review"] as const;
const LAST_STEP: StepIndex = 3;

/** The fields each step owns. Next validates only these (bug B3). */
const STEP_FIELDS: Record<1 | 2, ProjectFormFieldName[]> = {
  1: ["title", "tagline", "description", "category"],
  2: ["website_url", "favicon_url", "tags", "image_urls"],
};

/** The element that takes focus for a field. */
const FIELD_FOCUS_ID: Partial<Record<ProjectFormFieldName, string>> = {
  image_urls: SCREENSHOTS_DROPZONE_ID,
  tags: TAGS_FIELD_ID,
};

const FIRST_FIELD_ID: Record<StepIndex, string | null> = {
  0: "github_repo",
  1: "title",
  2: "website_url",
  3: null,
};

function stepOfField(field: ProjectFormFieldName): 1 | 2 {
  return STEP_FIELDS[1].includes(field) ? 1 : 2;
}

function firstErrorField(errors: FieldErrors): ProjectFormFieldName | undefined {
  return [...STEP_FIELDS[1], ...STEP_FIELDS[2]].find((field) => errors[field]);
}

function focusField(field: ProjectFormFieldName) {
  const element = document.getElementById(FIELD_FOCUS_ID[field] ?? field);
  if (!element) return;
  const target = element instanceof HTMLDivElement ? element.querySelector("input") : element;
  (target ?? element).focus();
  element.scrollIntoView?.({ block: "center" });
}

function formatImportedTagLabel(value: string): string {
  return value.replace(/(^|\s|[-_])(\w)/g, (_match, prefix: string, letter: string) => {
    return (prefix || "") + letter.toUpperCase();
  });
}

function applyImportedValue(current: string, imported: string | undefined): string {
  if (current.trim()) return current;
  return imported?.trim() || current;
}

function mergeImportedTextState(
  setState: Dispatch<SetStateAction<string>>,
  imported: string | undefined,
): void {
  setState((current) => applyImportedValue(current, imported));
}

function mergeImportedTags(selectedTags: Option[], importedTags: string[] | undefined): Option[] {
  if (!Array.isArray(importedTags) || importedTags.length === 0) {
    return selectedTags;
  }

  const existing = new Set(selectedTags.map((tag) => tag.value));
  const next: Option[] = [...selectedTags];

  for (const rawTag of importedTags) {
    const value = String(rawTag).toLowerCase();
    if (existing.has(value)) continue;
    next.push({ value, label: formatImportedTagLabel(value) });
    existing.add(value);
  }

  return next.slice(0, PROJECT_LIMITS.MAX_TAG_COUNT);
}

function toFormData(input: ProjectSubmissionInput, userId: string): FormData {
  const formData = new FormData();
  formData.set("userId", userId);
  formData.set(PROJECT_FORM_FIELDS.title, input.title);
  if (input.tagline) formData.set(PROJECT_FORM_FIELDS.tagline, input.tagline);
  formData.set(PROJECT_FORM_FIELDS.description, input.description);
  formData.set(PROJECT_FORM_FIELDS.category, input.category);
  if (input.websiteUrl) formData.set(PROJECT_FORM_FIELDS.websiteUrl, input.websiteUrl);
  if (input.faviconUrl) formData.set(PROJECT_FORM_FIELDS.faviconUrl, input.faviconUrl);
  formData.set(PROJECT_FORM_FIELDS.imageUrls, JSON.stringify(input.imageUrls));
  if (input.imageKeys.length > 0) {
    formData.set(PROJECT_FORM_FIELDS.imageKeys, JSON.stringify(input.imageKeys));
  }
  formData.set(PROJECT_FORM_FIELDS.tags, JSON.stringify(input.tags));
  return formData;
}

/** image_keys errors belong to the screenshots field the user can see. */
function visibleField(field: string): ProjectFormFieldName {
  return field === PROJECT_FORM_FIELDS.imageKeys
    ? PROJECT_FORM_FIELDS.imageUrls
    : (field as ProjectFormFieldName);
}

export function SubmitProjectForm({ userId, categories }: SubmitProjectFormProps) {
  const { t } = useTranslation("projectSubmit");
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadsBusy, setUploadsBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [announcement, setAnnouncement] = useState("");

  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [category, setCategory] = useState("");
  // A ref, not state: two clicks in one frame both see the old `isLoading`.
  const submitLockRef = useRef(false);
  // Where focus goes after the next step change. Null means the default.
  const pendingFocusRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const uploads = useScreenshotUploads({ announce: setAnnouncement });

  const categoryNames = useMemo(() => categories.map((item) => item.name), [categories]);

  const input = useMemo<ProjectSubmissionInput>(
    () => ({
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      category: category.trim(),
      websiteUrl: websiteUrl.trim(),
      faviconUrl: faviconUrl.trim(),
      imageUrls: uploads.images.imageUrls,
      imageKeys: uploads.images.imageKeys,
      tags: selectedTags.map((tag) => tag.value),
    }),
    [title, tagline, description, category, websiteUrl, faviconUrl, uploads.images, selectedTags],
  );

  /** Client-side errors for every field, in the user's language. */
  const validateAll = useCallback((): FieldErrors => {
    const result = buildProjectSubmissionSchema(categoryNames).safeParse(input);
    if (result.success) return {};
    const found: FieldErrors = {};
    for (const field of Object.keys(buildProjectFieldErrors(result.error))) {
      const name = visibleField(field);
      found[name] = t(`form.errors.${name}`);
    }
    return found;
  }, [categoryNames, input, t]);

  // Once a field shows an error, re-check it on every change so it clears when fixed.
  useEffect(() => {
    setErrors((previous) => {
      const shown = Object.keys(previous) as ProjectFormFieldName[];
      if (shown.length === 0) return previous;
      const current = validateAll();
      const next: FieldErrors = {};
      for (const field of shown) {
        if (current[field]) next[field] = previous[field];
      }
      return Object.keys(next).length === shown.length ? previous : next;
    });
  }, [validateAll]);

  useEffect(() => {
    if (!uploads.isUploading) setUploadsBusy(false);
  }, [uploads.isUploading]);

  // Move focus after a step change: the first field with a fine pointer, else the heading.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const pending = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (pending) {
      focusField(pending as ProjectFormFieldName);
      return;
    }
    const firstField = FIRST_FIELD_ID[currentStep];
    const finePointer =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;
    if (firstField && finePointer) {
      document.getElementById(firstField)?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [currentStep]);

  const goToStep = (step: StepIndex, focusId: string | null = null) => {
    pendingFocusRef.current = focusId;
    setFormError(null);
    setCurrentStep(step);
  };

  const fieldHasValue = (field: ProjectFormFieldName): boolean => {
    switch (field) {
      case "title":
        return Boolean(input.title);
      case "tagline":
        return Boolean(input.tagline);
      case "description":
        return Boolean(input.description);
      case "category":
        return Boolean(input.category);
      case "website_url":
        return Boolean(input.websiteUrl);
      case "favicon_url":
        return Boolean(input.faviconUrl);
      case "tags":
        return input.tags.length > 0;
      default:
        return input.imageUrls.length > 0;
    }
  };

  const handleFieldBlur = (field: ProjectFormFieldName) => {
    // No judgement on a field the user has not filled in yet.
    if (!fieldHasValue(field)) return;
    const message = validateAll()[field];
    setErrors((previous) => {
      if (previous[field] === message) return previous;
      const next = { ...previous };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // A late import response would pull the user back to Basics.
      if (isImporting) return;
      goToStep(1);
      return;
    }
    if (currentStep === 2 && uploads.isUploading) {
      setUploadsBusy(true);
      return;
    }
    const step = currentStep as 1 | 2;
    const all = validateAll();
    const stepErrors: FieldErrors = {};
    for (const field of STEP_FIELDS[step]) {
      if (all[field]) stepErrors[field] = all[field];
    }
    const first = firstErrorField(stepErrors);
    setErrors((previous) => {
      const next = { ...previous };
      for (const field of STEP_FIELDS[step]) delete next[field];
      return { ...next, ...stepErrors };
    });
    if (first) {
      focusField(first);
      return;
    }
    goToStep((step + 1) as StepIndex);
  };

  const handleBack = () => {
    if (currentStep > 0) goToStep((currentStep - 1) as StepIndex);
  };

  const showFieldErrors = (fieldErrors: FieldErrors) => {
    setErrors(fieldErrors);
    const first = firstErrorField(fieldErrors);
    if (!first) return;
    const step = stepOfField(first);
    if (step === currentStep) {
      focusField(first);
    } else {
      goToStep(step, FIELD_FOCUS_ID[first] ?? first);
    }
  };

  const handleSubmitResultError = (result: Awaited<ReturnType<typeof submitProjectFn>>) => {
    const serverErrors: ProjectFieldErrors = result?.fieldErrors ?? {};
    const mapped: FieldErrors = {};
    for (const [field, messages] of Object.entries(serverErrors)) {
      const message = messages?.[0];
      if (message) mapped[visibleField(field)] = message;
    }
    if (firstErrorField(mapped)) {
      showFieldErrors(mapped);
      return;
    }
    setFormError(result?.error || t("toast.error"));
  };

  const handleSubmit = async () => {
    if (submitLockRef.current) return;

    // Final gate: every field, not just this step.
    const all = validateAll();
    if (firstErrorField(all)) {
      showFieldErrors(all);
      return;
    }

    submitLockRef.current = true;
    setIsLoading(true);
    setFormError(null);
    setAnnouncement(t("form.announceSubmitting"));
    // Keep the screenshots while the server attaches them: no cleanup on reload or unmount.
    uploads.release();

    try {
      const result = await submitProjectFn({ data: toFormData(input, userId) });
      if (result.success && result.slug) {
        toast.success(t("toast.success"));
        // Stay locked while the project page loads. A second submit would reuse
        // screenshots that now belong to the new project and fail.
        router.navigate({ to: "/project/$slug", params: { slug: result.slug } });
        return;
      }
      handleSubmitResultError(result);
    } catch (err) {
      setFormError(err instanceof Error && err.message ? err.message : t("toast.error"));
    }
    uploads.resume();
    submitLockRef.current = false;
    setIsLoading(false);
  };

  const importErrorMessage = (code: GitHubImportErrorCode | undefined): string | undefined => {
    switch (code) {
      case "notFound":
        return t("form.importError.notFound");
      case "rateLimited":
        return t("form.importError.rateLimited");
      case "invalidUrl":
        return t("form.importError.invalidUrl");
      case "failed":
        return t("form.importFailed");
      default:
        return undefined;
    }
  };

  const handleGitHubImport = async () => {
    if (!githubRepoUrl.trim()) {
      setImportError(t("form.importEmpty"));
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setAnnouncement(t("form.announceImporting"));

    try {
      const response = await fetch("/api/github-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: githubRepoUrl.trim() }),
      });

      const data = (await response.json()) as GitHubImportData & {
        error?: string;
        code?: GitHubImportErrorCode;
      };
      if (!response.ok) {
        throw new Error(importErrorMessage(data.code) ?? data.error ?? t("form.importFailed"));
      }

      mergeImportedTextState(setTitle, data.title);
      mergeImportedTextState(setTagline, data.tagline);
      mergeImportedTextState(setDescription, data.description);
      mergeImportedTextState(setWebsiteUrl, data.website_url);

      // Leave the favicon field empty: the server fetches the icon for the submitted website.

      const previewUrl = data.preview_image_url || data.image_url;
      if (previewUrl) uploads.setImported(previewUrl);

      if (data.tags && data.tags.length > 0) {
        setSelectedTags((prev) => mergeImportedTags(prev, data.tags));
      }

      toast.success(t("form.importSuccess"));
      setAnnouncement(t("form.announceImported"));
      goToStep(1);
    } catch (err) {
      setAnnouncement("");
      setImportError(err instanceof Error && err.message ? err.message : t("form.importFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  const leave = () => {
    uploads.discardAll();
    router.navigate({ to: "/project/list" });
  };

  const handleCancel = () => {
    const hasWork =
      uploads.shots.length > 0 ||
      selectedTags.length > 0 ||
      [title, tagline, description, category, websiteUrl, faviconUrl].some((value) => value.trim());
    if (hasWork) {
      setConfirmCancel(true);
      return;
    }
    leave();
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    if (currentStep === LAST_STEP) {
      void handleSubmit();
    } else {
      handleNext();
    }
  };

  const steps = STEP_IDS.map((id) => ({ id, title: t(`steps.${id}`) }));
  const stepId = STEP_IDS[currentStep];
  const fieldProps = { errors, onFieldBlur: handleFieldBlur, disabled: isLoading };
  const isLastStep = currentStep === LAST_STEP;

  return (
    <>
      <form noValidate onSubmit={handleFormSubmit} className="w-full">
        <Card className="mx-auto w-full max-w-2xl gap-0 py-0">
          <CardHeader className="border-b pt-6 pb-6">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onSelect={(index) => goToStep(index as StepIndex)}
              locked={isLoading}
            />
          </CardHeader>

          <CardContent className="pt-8 pb-8">
            {formError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <section
              key={stepId}
              aria-labelledby="step-heading"
              className="animate-auth-step-in space-y-6"
            >
              <h2
                id="step-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-semibold outline-none"
              >
                {t(`steps.headings.${stepId}`)}
              </h2>

              {currentStep === 0 && (
                <SourceStep
                  githubRepoUrl={githubRepoUrl}
                  setGithubRepoUrl={setGithubRepoUrl}
                  disabled={isLoading}
                  isImporting={isImporting}
                  importError={importError}
                  onImport={handleGitHubImport}
                  onSkip={() => goToStep(1)}
                />
              )}

              {currentStep === 1 && (
                <BasicsStep
                  title={title}
                  setTitle={setTitle}
                  tagline={tagline}
                  setTagline={setTagline}
                  description={description}
                  setDescription={setDescription}
                  category={category}
                  setCategory={setCategory}
                  categories={categories}
                  {...fieldProps}
                />
              )}

              {currentStep === 2 && (
                <LinksMediaStep
                  websiteUrl={websiteUrl}
                  setWebsiteUrl={setWebsiteUrl}
                  faviconUrl={faviconUrl}
                  setFaviconUrl={setFaviconUrl}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  shots={uploads.shots}
                  uploadNotice={uploads.notice}
                  uploadsBusyMessage={uploadsBusy ? t("form.uploadsBusy") : null}
                  onAddFiles={uploads.addFiles}
                  onRetryShot={uploads.retry}
                  onRemoveShot={uploads.remove}
                  onMakeCover={uploads.makeCover}
                  onMoveShot={uploads.move}
                  {...fieldProps}
                />
              )}

              {currentStep === 3 && (
                <ReviewStep
                  title={title}
                  tagline={tagline}
                  description={description}
                  categoryLabel={
                    categories.find((item) => item.name === category)?.display_name ?? category
                  }
                  websiteUrl={websiteUrl}
                  faviconUrl={faviconUrl}
                  tags={selectedTags}
                  imageUrls={uploads.images.imageUrls}
                  onEdit={(step) => goToStep(step, FIRST_FIELD_ID[step])}
                  disabled={isLoading}
                />
              )}
            </section>
          </CardContent>

          <CardFooter className="sticky bottom-0 flex justify-between gap-3 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:bg-transparent sm:px-6 sm:pt-6 sm:pb-6 sm:backdrop-blur-none">
            {currentStep === 0 ? (
              <Button
                type="button"
                variant="ghost"
                data-testid="cancel-button"
                ref={cancelButtonRef}
                onClick={handleCancel}
                disabled={isLoading}
                className="h-11 px-5 text-base sm:h-10 sm:text-sm"
              >
                {t("form.cancel")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                data-testid="prev-step-button"
                onClick={handleBack}
                disabled={isLoading}
                className="h-11 px-5 text-base sm:h-10 sm:text-sm"
              >
                {t("form.back")}
              </Button>
            )}
            <Button
              type="submit"
              data-testid={isLastStep ? "submit-project-button" : "next-step-button"}
              aria-busy={isLoading || undefined}
              aria-disabled={isLoading || undefined}
              className={cn(
                authPrimaryButtonClassName,
                "h-11 w-auto px-5 text-base sm:h-10 sm:text-sm motion-reduce:active:scale-100",
              )}
            >
              <span className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
                <span className={cn(isLoading && isLastStep && "opacity-0")}>
                  {isLastStep ? t("form.submit") : t("form.next")}
                </span>
                {isLoading && isLastStep && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
              </span>
            </Button>
          </CardFooter>
        </Card>
      </form>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // Opened without a Trigger, so tell Radix where focus goes back to.
            event.preventDefault();
            cancelButtonRef.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("form.confirmCancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("form.confirmCancelBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("form.confirmCancelKeep")}</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>{t("form.confirmCancelDiscard")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
