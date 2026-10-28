"use client";

import { Loader2 } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Option } from "@/components/ui/multiselect";
import { Stepper } from "@/components/ui/stepper";
import { BasicsStep } from "@/components/ui/submit-project-form/steps/basics-step";
import { LinksMediaStep } from "@/components/ui/submit-project-form/steps/links-media-step";
import { ReviewStep } from "@/components/ui/submit-project-form/steps/review-step";
import { SourceStep } from "@/components/ui/submit-project-form/steps/source-step";
import {
  cleanupProjectProvisionalUploadFn,
  submitProjectFn,
} from "@/lib/actions/projects.functions";
import type { Category } from "@/lib/categories";
import { getFaviconUrl } from "@/lib/favicon-utils";
import { useRouter } from "@/lib/navigation";
import {
  buildProjectFieldErrors,
  buildProjectSubmissionSchema,
  formatProjectFieldErrors,
  PROJECT_FIELD_SCHEMAS,
  PROJECT_FORM_FIELDS,
  PROJECT_LIMITS,
  parseProjectFormData,
  parseResultToFieldErrors,
} from "@/lib/project-submission";
import {
  getConfirmedUpload,
  type ProjectUploadResult,
  UNCONFIRMED_UPLOAD_MESSAGE,
} from "@/lib/project-upload-result";

// --- Types ---

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

interface SubmitFormState {
  title: string;
  tagline: string;
  description: string;
  uploadedImageUrls: string[];
  importedImageUrl: string;
  uploadedImageKeys: string[];
  selectedTags: Option[];
  websiteUrl: string;
  faviconUrl: string;
  githubRepoUrl: string;
  category: string;
  currentStep: number;
}

// --- Constants ---

const STEPS = [
  { id: "source", title: "Source" },
  { id: "basics", title: "Basics" },
  { id: "links-media", title: "Links & Media" },
  { id: "review", title: "Review & Submit" },
];

// --- Helpers ---

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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

function buildSubmitFormData(state: SubmitFormState): FormData {
  const formData = new FormData();

  if (state.title) formData.set(PROJECT_FORM_FIELDS.title, state.title);
  if (state.tagline) formData.set(PROJECT_FORM_FIELDS.tagline, state.tagline);
  if (state.description) formData.set(PROJECT_FORM_FIELDS.description, state.description);

  const allImageUrls = [...state.uploadedImageUrls];
  if (state.importedImageUrl && !allImageUrls.includes(state.importedImageUrl)) {
    allImageUrls.push(state.importedImageUrl);
  }

  if (allImageUrls.length > 0) {
    formData.set(PROJECT_FORM_FIELDS.imageUrls, JSON.stringify(allImageUrls));
  }

  if (state.uploadedImageKeys.length > 0) {
    formData.set(PROJECT_FORM_FIELDS.imageKeys, JSON.stringify(state.uploadedImageKeys));
  }

  formData.set(
    PROJECT_FORM_FIELDS.tags,
    JSON.stringify(state.selectedTags.map((tag) => tag.value)),
  );

  if (state.websiteUrl) {
    formData.set(PROJECT_FORM_FIELDS.websiteUrl, state.websiteUrl);
  }

  if (state.category) {
    formData.set(PROJECT_FORM_FIELDS.category, state.category);
  }

  return formData;
}

// --- Main Component ---

export function SubmitProjectForm({ userId, categories }: SubmitProjectFormProps) {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [importedImageUrl, setImportedImageUrl] = useState<string>("");
  const [uploadedImageKeys, setUploadedImageKeys] = useState<string[]>([]);
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [title, setTitle] = useState<string>("");
  const [tagline, setTagline] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [githubRepoUrl, setGithubRepoUrl] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  // A ref, not state: two clicks in one frame both see the old `isLoading`.
  const submitLockRef = useRef(false);

  const router = useRouter();

  const getCurrentFormState = useCallback(
    (): SubmitFormState => ({
      title,
      tagline,
      description,
      uploadedImageUrls,
      importedImageUrl,
      uploadedImageKeys,
      selectedTags,
      websiteUrl,
      faviconUrl,
      githubRepoUrl,
      category,
      currentStep,
    }),
    [
      category,
      currentStep,
      description,
      faviconUrl,
      githubRepoUrl,
      importedImageUrl,
      selectedTags,
      tagline,
      title,
      uploadedImageKeys,
      uploadedImageUrls,
      websiteUrl,
    ],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateCurrentStep = (): boolean => {
    setError(null);

    const parsed = parseProjectFormData(buildSubmitFormData(getCurrentFormState()));
    if (!parsed.ok) {
      setError(formatProjectFieldErrors(parseResultToFieldErrors(parsed.issues)));
      return false;
    }
    const input = parsed.input;

    if (currentStep === 1) {
      const partial = z.object({
        title: PROJECT_FIELD_SCHEMAS.title,
        tagline: PROJECT_FIELD_SCHEMAS.tagline,
        description: PROJECT_FIELD_SCHEMAS.description,
        category: PROJECT_FIELD_SCHEMAS.category,
      });

      const result = partial.safeParse(input);
      if (!result.success) {
        setError(formatProjectFieldErrors(buildProjectFieldErrors(result.error)));
        return false;
      }
    }

    if (currentStep === 2) {
      const partial = z.object({
        websiteUrl: PROJECT_FIELD_SCHEMAS.websiteUrl,
        imageUrls: PROJECT_FIELD_SCHEMAS.imageUrls,
        tags: PROJECT_FIELD_SCHEMAS.tags,
      });

      const result = partial.safeParse(input);
      if (!result.success) {
        setError(formatProjectFieldErrors(buildProjectFieldErrors(result.error)));
        return false;
      }
    }

    return true;
  };

  const handleSubmitResultError = (result: Awaited<ReturnType<typeof submitProjectFn>>) => {
    if (!result) {
      setError("An unexpected error occurred. Please try again.");
      return;
    }

    if (result.fieldErrors) {
      const messages = formatProjectFieldErrors(result.fieldErrors);
      if (messages.length > 0) {
        setError(messages);
        return;
      }
    }

    setError(result.error || "Something went wrong. Please try again.");
  };

  const handleSubmit = async () => {
    if (submitLockRef.current) return;
    if (!validateCurrentStep()) return;

    // Final gate: validate ALL fields, not just the active step, before talking to the server.
    const parsed = parseProjectFormData(buildSubmitFormData(getCurrentFormState()));
    if (!parsed.ok) {
      setError(formatProjectFieldErrors(parseResultToFieldErrors(parsed.issues)));
      return;
    }
    const fullValidation = buildProjectSubmissionSchema(
      categories.map((category) => category.name),
    ).safeParse(parsed.input);
    if (!fullValidation.success) {
      setError(formatProjectFieldErrors(buildProjectFieldErrors(fullValidation.error)));
      return;
    }
    const formData = buildSubmitFormData(getCurrentFormState());
    formData.set("userId", userId);

    submitLockRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitProjectFn({ data: formData });
      if (result.success && result.slug) {
        toast.success("Mantap! 🚀 Project lo berhasil di-submit!");
        // Stay locked while the project page loads. A second submit would reuse
        // screenshots that now belong to the new project and fail.
        router.navigate({ to: "/project/$slug", params: { slug: result.slug } });
        return;
      }
      handleSubmitResultError(result);
    } catch (err) {
      setError(getErrorMessage(err, "An unexpected error occurred"));
    }
    submitLockRef.current = false;
    setIsLoading(false);
  };

  const handleGitHubImportClick = async () => {
    if (!githubRepoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/github-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: githubRepoUrl.trim() }),
      });

      const data = (await response.json()) as GitHubImportData & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to import repo");
      }

      mergeImportedTextState(setTitle, data.title);
      mergeImportedTextState(setTagline, data.tagline);
      mergeImportedTextState(setDescription, data.description);
      mergeImportedTextState(setWebsiteUrl, data.website_url);

      if (data.favicon_url) {
        setFaviconUrl(data.favicon_url);
      } else if (data.website_url) {
        setFaviconUrl(getFaviconUrl(data.website_url));
      }

      if (data.preview_image_url || data.image_url) {
        setImportedImageUrl(data.preview_image_url || data.image_url || "");
      }

      if (data.tags && data.tags.length > 0) {
        setSelectedTags((prev) => mergeImportedTags(prev, data.tags));
      }

      toast.success("Repository imported successfully!");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to import GitHub repository"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleUploadBegin = (_name: string) => {
    setIsUploading(true);
    setError(null);
    if (uploadTimeout) {
      clearTimeout(uploadTimeout);
    }
    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      setError("Upload timed out. Please try again.");
    }, 120000);
    setUploadTimeout(timeoutId);
  };

  const handleUploadComplete = (res: ProjectUploadResult[] | undefined) => {
    if (uploadTimeout) {
      clearTimeout(uploadTimeout);
      setUploadTimeout(null);
    }
    setIsUploading(false);
    setError(null);
    if (!res || res.length === 0) {
      setError("Upload completed but no files were received. Please try again.");
      return;
    }
    const confirmed = res.map(getConfirmedUpload).filter((upload) => upload !== null);
    if (confirmed.length > 0) {
      setUploadedImageUrls((prev) => [...prev, ...confirmed.map((upload) => upload.url)]);
      setUploadedImageKeys((prev) => [...prev, ...confirmed.map((upload) => upload.key)]);
    }
    if (confirmed.length < res.length) {
      setError(UNCONFIRMED_UPLOAD_MESSAGE);
    }
  };

  const handleRemoveUploadedImage = (index: number) => {
    const imageKey = uploadedImageKeys[index];
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedImageKeys((prev) => prev.filter((_, i) => i !== index));
    if (imageKey) {
      // Best effort. An orphan file costs storage, not correctness.
      cleanupProjectProvisionalUploadFn({ data: { imageKey } }).catch(() => {});
    }
  };

  const cleanupActiveUpload = async () => {
    if (uploadedImageKeys.length === 0) {
      return true;
    }
    try {
      const results = await Promise.all(
        uploadedImageKeys.map((imageKey) =>
          cleanupProjectProvisionalUploadFn({ data: { imageKey } }),
        ),
      );
      if (results.every((result) => result.success)) {
        setUploadedImageUrls([]);
        setUploadedImageKeys([]);
        return true;
      }
    } catch {
      // Ignore cleanup error
    }
    setError("Failed to clean up the uploaded screenshot. Please try again.");
    toast.error("Failed to clean up the uploaded screenshot");
    return false;
  };

  const handleUploadError = (error: Error) => {
    if (uploadTimeout) {
      clearTimeout(uploadTimeout);
      setUploadTimeout(null);
    }
    setIsUploading(false);
    setError(`Upload failed: ${error.message}`);
  };

  return (
    <Stepper
      steps={STEPS}
      initialStep={currentStep}
      onStepChange={setCurrentStep}
      canProceed={!isLoading && !isUploading}
    >
      <Card className="w-full max-w-3xl mx-auto flex flex-col relative overflow-visible">
        <CardHeader className="bg-muted/50 border-b pb-6">
          <CardTitle className="text-2xl">Project Details</CardTitle>
          <Stepper.Indicator />
        </CardHeader>

        <CardContent className="pt-10 pb-24">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/20 mb-6"
            >
              {error}
            </div>
          )}

          <Stepper.Step index={0}>
            <SourceStep
              mounted={mounted}
              githubRepoUrl={githubRepoUrl}
              setGithubRepoUrl={setGithubRepoUrl}
              isLoading={isLoading}
              isUploading={isUploading}
              isImporting={isImporting}
              onImport={handleGitHubImportClick}
            />
          </Stepper.Step>

          <Stepper.Step index={1}>
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
              isLoading={isLoading}
              isUploading={isUploading}
            />
          </Stepper.Step>

          <Stepper.Step index={2}>
            <LinksMediaStep
              websiteUrl={websiteUrl}
              setWebsiteUrl={setWebsiteUrl}
              faviconUrl={faviconUrl}
              setFaviconUrl={setFaviconUrl}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              uploadedImageUrls={uploadedImageUrls}
              onRemoveUploadedImage={handleRemoveUploadedImage}
              importedImageUrl={importedImageUrl}
              setImportedImageUrl={setImportedImageUrl}
              isLoading={isLoading}
              isUploading={isUploading}
              onUploadBegin={handleUploadBegin}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </Stepper.Step>

          <Stepper.Step index={3}>
            <ReviewStep
              title={title}
              tagline={tagline}
              description={description}
              categoryLabel={
                categories.find((item) => item.name === category)?.display_name ?? category
              }
              websiteUrl={websiteUrl}
              tags={selectedTags}
              imageUrls={
                importedImageUrl && !uploadedImageUrls.includes(importedImageUrl)
                  ? [...uploadedImageUrls, importedImageUrl]
                  : uploadedImageUrls
              }
            />
          </Stepper.Step>
        </CardContent>

        <CardFooter className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t p-4 sm:absolute sm:border-t-0 sm:bg-transparent sm:backdrop-blur-none flex justify-between">
          <Stepper.Actions
            renderBack={({ onClick, label }) => (
              <Button
                variant="outline"
                data-testid="prev-step-button"
                onClick={async () => {
                  if (currentStep === 0) {
                    const cleanedUp = await cleanupActiveUpload();
                    if (!cleanedUp) return;
                    router.back();
                  } else {
                    onClick();
                  }
                }}
                disabled={isLoading || isUploading}
              >
                {label}
              </Button>
            )}
            renderNext={({ onClick, label, isLastStep }) => (
              <Button
                data-testid={isLastStep ? "submit-project-button" : "next-step-button"}
                onClick={() => {
                  if (isLastStep) {
                    handleSubmit();
                  } else {
                    if (validateCurrentStep()) {
                      onClick();
                    }
                  }
                }}
                disabled={isLoading || isUploading}
                className={isLastStep ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                {isLoading && isLastStep ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  label
                )}
              </Button>
            )}
          />
        </CardFooter>
        <div className="h-20 sm:hidden" />
      </Card>
    </Stepper>
  );
}
