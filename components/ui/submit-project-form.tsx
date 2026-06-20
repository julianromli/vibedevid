"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { BasicsStep } from "@/components/ui/submit-project-form/steps/basics-step";
import { LinksMediaStep } from "@/components/ui/submit-project-form/steps/links-media-step";
import { ReviewStep } from "@/components/ui/submit-project-form/steps/review-step";
import { SourceStep } from "@/components/ui/submit-project-form/steps/source-step";
import type { UploadResult } from "@/components/ui/submit-project-form/types";
import {
  cleanupProjectProvisionalUploadFn,
  submitProjectFn,
} from "@/lib/actions/projects.functions";
import type { Category } from "@/lib/categories";
import { getFaviconUrl } from "@/lib/favicon-utils";
import type { Option } from "@/components/ui/multiselect";

// --- Types ---

interface SubmitProjectFormProps {
  userId: string;
  categories: Category[];
  redirectTo: string;
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

interface StoredSubmitProjectDraft {
  version: number;
  savedAt: number;
  state: SubmitFormState;
}

interface DraftNoticeState {
  kind: "available" | "restored";
  savedAt?: number;
}

// --- Constants ---

const MIN_TITLE_LENGTH = 3;
const MIN_DESCRIPTION_LENGTH = 30;
const DRAFT_STORAGE_VERSION = 1;
const DRAFT_STORAGE_KEY_PREFIX = "submit-project-draft";
const AUTH_REQUIRED_ERROR_MESSAGE = "You must be logged in to submit projects";

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

  return next.slice(0, 10);
}

function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function getDraftStorageKey(redirectTo: string): string {
  return `${DRAFT_STORAGE_KEY_PREFIX}:${redirectTo}`;
}

function clampStepIndex(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(value), 0), 3);
}

function normalizeDraftTags(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];

  const normalized: Option[] = [];
  const seen = new Set<string>();

  for (const tag of value) {
    if (!tag || typeof tag !== "object") continue;
    const rawValue = "value" in tag && typeof tag.value === "string" ? tag.value.trim() : "";
    if (!rawValue) continue;

    const normalizedValue = rawValue.toLowerCase();
    if (seen.has(normalizedValue)) continue;

    const label =
      "label" in tag && typeof tag.label === "string" && tag.label.trim()
        ? tag.label.trim()
        : formatImportedTagLabel(normalizedValue);

    normalized.push({ value: normalizedValue, label });
    seen.add(normalizedValue);
  }

  return normalized.slice(0, 10);
}

function hasMeaningfulDraft(state: SubmitFormState): boolean {
  return Boolean(
    state.currentStep > 0 ||
    state.title.trim() ||
    state.tagline.trim() ||
    state.description.trim() ||
    state.uploadedImageUrls.length > 0 ||
    state.importedImageUrl.trim() ||
    state.uploadedImageKeys.length > 0 ||
    state.selectedTags.length > 0 ||
    state.websiteUrl.trim() ||
    state.faviconUrl.trim() ||
    state.githubRepoUrl.trim() ||
    state.category.trim(),
  );
}

function parseStoredDraft(rawValue: string | null): StoredSubmitProjectDraft | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredSubmitProjectDraft>;
    if (
      parsed.version !== DRAFT_STORAGE_VERSION ||
      !parsed.state ||
      typeof parsed.state !== "object"
    ) {
      return null;
    }

    const state = parsed.state as Partial<SubmitFormState>;
    const normalizedState: SubmitFormState = {
      title: typeof state.title === "string" ? state.title : "",
      tagline: typeof state.tagline === "string" ? state.tagline : "",
      description: typeof state.description === "string" ? state.description : "",
      uploadedImageUrls: Array.isArray(state.uploadedImageUrls) ? state.uploadedImageUrls : [],
      importedImageUrl: typeof state.importedImageUrl === "string" ? state.importedImageUrl : "",
      uploadedImageKeys: Array.isArray(state.uploadedImageKeys) ? state.uploadedImageKeys : [],
      selectedTags: normalizeDraftTags(state.selectedTags),
      websiteUrl: typeof state.websiteUrl === "string" ? state.websiteUrl : "",
      faviconUrl: typeof state.faviconUrl === "string" ? state.faviconUrl : "",
      githubRepoUrl: typeof state.githubRepoUrl === "string" ? state.githubRepoUrl : "",
      category: typeof state.category === "string" ? state.category : "",
      currentStep: clampStepIndex(state.currentStep),
    };

    if (!hasMeaningfulDraft(normalizedState)) return null;

    return {
      version: DRAFT_STORAGE_VERSION,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
      state: normalizedState,
    };
  } catch {
    return null;
  }
}

function getUploadImageUrl(uploadResult: UploadResult | undefined): string | null {
  return uploadResult?.serverData?.url || uploadResult?.url || null;
}

function getUploadImageKey(uploadResult: UploadResult | undefined): string | null {
  return uploadResult?.serverData?.key || uploadResult?.key || null;
}

function buildSubmitFormData(state: SubmitFormState): FormData {
  const formData = new FormData();

  if (state.title) formData.set("title", state.title);
  if (state.tagline) formData.set("tagline", state.tagline);
  if (state.description) formData.set("description", state.description);

  const allImageUrls = [...state.uploadedImageUrls];
  if (state.importedImageUrl && !allImageUrls.includes(state.importedImageUrl)) {
    allImageUrls.push(state.importedImageUrl);
  }

  if (allImageUrls.length > 0) {
    formData.set("image_urls", JSON.stringify(allImageUrls));
  }

  if (state.uploadedImageKeys.length > 0) {
    formData.set("image_keys", JSON.stringify(state.uploadedImageKeys));
  }

  formData.set("tags", JSON.stringify(state.selectedTags.map((tag) => tag.value)));

  if (state.websiteUrl) {
    formData.set("website_url", state.websiteUrl);
  }

  if (state.category) {
    formData.set("category", state.category);
  }

  return formData;
}

// --- Main Component ---

export function SubmitProjectForm({ userId, categories, redirectTo }: SubmitProjectFormProps) {
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
  const [pendingDraft, setPendingDraft] = useState<StoredSubmitProjectDraft | null>(null);
  const [draftNotice, setDraftNotice] = useState<DraftNoticeState | null>(null);

  const router = useRouter();

  const getCurrentDraftState = useCallback(
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
    const restoredDraft = parseStoredDraft(sessionStorage.getItem(getDraftStorageKey(redirectTo)));
    if (restoredDraft) {
      setPendingDraft(restoredDraft);
      setDraftNotice({ kind: "available", savedAt: restoredDraft.savedAt });
    }
  }, [redirectTo]);

  // Draft persistence
  useEffect(() => {
    const key = getDraftStorageKey(redirectTo);
    const handleBeforeUnload = () => {
      const draft = getCurrentDraftState();
      if (hasMeaningfulDraft(draft)) {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            version: DRAFT_STORAGE_VERSION,
            savedAt: Date.now(),
            state: draft,
          }),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [redirectTo, getCurrentDraftState]);

  const validateCurrentStep = (): boolean => {
    setError(null);

    if (currentStep === 1) {
      const issues: string[] = [];
      if (!title.trim()) issues.push("Project title is required");
      else if (title.trim().length < MIN_TITLE_LENGTH)
        issues.push(`Title must be at least ${MIN_TITLE_LENGTH} characters`);
      if (!description.trim()) issues.push("Project description is required");
      else if (description.trim().length < MIN_DESCRIPTION_LENGTH)
        issues.push(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
      if (!category) issues.push("Please select a category");

      if (issues.length > 0) {
        setError(issues.join(". "));
        return false;
      }
    }

    if (currentStep === 2) {
      if (websiteUrl.trim() && !isValidWebsiteUrl(websiteUrl)) {
        setError("Please enter a valid website URL or leave it empty");
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
      const messages = Object.entries(result.fieldErrors)
        .filter(([, errors]) => errors && errors.length > 0)
        .map(([field, errors]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
          return `${fieldName}: ${errors.join(", ")}`;
        });
      if (messages.length > 0) {
        setError(messages.join(". "));
        return;
      }
    }

    setError(result.error || "Something went wrong. Please try again.");
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setError(null);

    const formData = buildSubmitFormData(getCurrentDraftState());
    formData.set("userId", userId);

    try {
      const result = await submitProjectFn({ data: formData });
      if (result.success) {
        toast.success("Mantap! 🚀 Project lo berhasil di-submit!");
        router.navigate({ to: `/project/${result.slug}` });
      } else {
        handleSubmitResultError(result);
      }
    } catch (err) {
      setError(getErrorMessage(err, "An unexpected error occurred"));
    } finally {
      setIsLoading(false);
    }
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

  const handleUploadComplete = (res: UploadResult[] | undefined) => {
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
    const newImageUrls: string[] = [];
    const newImageKeys: string[] = [];
    for (const uploadResult of res) {
      const imageUrl = getUploadImageUrl(uploadResult);
      const imageKey = getUploadImageKey(uploadResult);
      if (imageUrl && imageKey) {
        newImageUrls.push(imageUrl);
        newImageKeys.push(imageKey);
      }
    }
    if (newImageUrls.length > 0) {
      setUploadedImageUrls((prev) => [...prev, ...newImageUrls]);
      setUploadedImageKeys((prev) => [...prev, ...newImageKeys]);
      return;
    }
    setError("Upload completed but response format is invalid. Please try again.");
  };

  const cleanupActiveUpload = async () => {
    if (uploadedImageKeys.length === 0) {
      return true;
    }
    try {
      const result = await cleanupProjectProvisionalUploadFn({
        data: { imageKey: uploadedImageKeys[uploadedImageKeys.length - 1] },
      });
      if (result.success) {
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
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/20 mb-6">
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
              setUploadedImageUrls={setUploadedImageUrls}
              uploadedImageKeys={uploadedImageKeys}
              setUploadedImageKeys={setUploadedImageKeys}
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
            <ReviewStep />
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
