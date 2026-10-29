import { Image } from "@unpic/react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  ImagePlus,
  Loader2,
  RotateCw,
  Star,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FieldMessage } from "@/components/auth/field-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authInputClassName } from "@/components/ui/form-classes";
import { Input } from "@/components/ui/input";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import { Progress } from "@/components/ui/progress";
import {
  errorId,
  FieldFooter,
  FieldLabel,
  type FieldStepProps,
  fieldAria,
  hintId,
} from "@/components/ui/submit-project-form/field-parts";
import { getFaviconUrl } from "@/lib/favicon-utils";
import { MAX_SCREENSHOTS, type Shot } from "@/lib/project-screenshots";
import { PROJECT_LIMITS } from "@/lib/project-submission";
import { normalizeProjectWebsiteUrl } from "@/lib/project-url";
import { cn } from "@/lib/utils";

const techOptions: Option[] = [
  { value: "next.js", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "tailwindcss", label: "Tailwind CSS" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "nodejs", label: "Node.js" },
  { value: "express", label: "Express.js" },
  { value: "fastify", label: "Fastify" },
  { value: "nestjs", label: "NestJS" },
  { value: "python", label: "Python" },
  { value: "django", label: "Django" },
  { value: "flask", label: "Flask" },
  { value: "fastapi", label: "FastAPI" },
  { value: "java", label: "Java" },
  { value: "spring", label: "Spring Boot" },
  { value: "csharp", label: "C#" },
  { value: "dotnet", label: ".NET" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "laravel", label: "Laravel" },
  { value: "mongodb", label: "MongoDB" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "redis", label: "Redis" },
  { value: "supabase", label: "Supabase" },
  { value: "firebase", label: "Firebase" },
  { value: "aws", label: "AWS" },
  { value: "vercel", label: "Vercel" },
  { value: "netlify", label: "Netlify" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "graphql", label: "GraphQL" },
  { value: "apollo", label: "Apollo" },
  { value: "trpc", label: "tRPC" },
  { value: "prisma", label: "Prisma" },
  { value: "drizzle", label: "Drizzle" },
  { value: "shadcn", label: "shadcn/ui" },
  { value: "chakra", label: "Chakra UI" },
  { value: "mantine", label: "Mantine" },
  { value: "antd", label: "Ant Design" },
  { value: "material-ui", label: "Material-UI" },
];

export const SCREENSHOTS_DROPZONE_ID = "screenshots-dropzone";
/** cmdk overrides the tag input's id, so focus finds the input through this wrapper. */
export const TAGS_FIELD_ID = "tags-field";

export interface LinksMediaStepProps extends FieldStepProps {
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  faviconUrl: string;
  setFaviconUrl: (value: string) => void;
  selectedTags: Option[];
  setSelectedTags: (value: Option[]) => void;
  shots: Shot[];
  uploadNotice: string | null;
  /** Shown when the user pressed Next while uploads were still running. */
  uploadsBusyMessage: string | null;
  onAddFiles: (files: File[]) => void;
  onRetryShot: (id: string) => void;
  onRemoveShot: (id: string) => void;
  onMakeCover: (id: string) => void;
  onMoveShot: (id: string, delta: -1 | 1) => void;
}

const iconButton = "size-11 rounded-lg sm:size-8";

function ShotTile({
  shot,
  index,
  count,
  disabled,
  onRetry,
  onRemove,
  onMakeCover,
  onMove,
}: {
  shot: Shot;
  index: number;
  count: number;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
  onMakeCover: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const { t } = useTranslation("projectSubmit");
  const n = index + 1;
  const isCover = index === 0;
  const isBusy = shot.status === "queued" || shot.status === "uploading";

  return (
    <li className="animate-auth-step-in space-y-2" data-testid={`screenshot-tile-${index}`}>
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-xl border bg-muted",
          shot.status === "error" && "border-destructive",
        )}
      >
        {shot.previewUrl && (
          <Image
            src={shot.url ?? shot.previewUrl}
            alt={t("form.upload.alt", { n })}
            className={cn("h-full w-full object-cover", isBusy && "opacity-60")}
            width={320}
            height={180}
          />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {isCover && <Badge variant="secondary">{t("form.upload.cover")}</Badge>}
          {shot.source === "github" && (
            <Badge variant="outline" className="bg-background/90">
              {t("form.upload.fromGithub")}
            </Badge>
          )}
        </div>
        {isBusy && (
          <Progress
            value={shot.progress}
            className="absolute inset-x-0 bottom-0 h-1 rounded-none [&>*]:transition-transform [&>*]:duration-200 [&>*]:ease-out"
            aria-label={t("form.upload.alt", { n })}
          />
        )}
      </div>
      {isBusy && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          {shot.status === "queued"
            ? t("form.upload.queued")
            : t("form.upload.progress", { progress: shot.progress })}
        </p>
      )}
      {shot.status === "error" && shot.error && (
        <FieldMessage id={`screenshot-${shot.id}-error`} tone="error">
          {shot.error}
        </FieldMessage>
      )}
      <div className="flex flex-wrap items-center gap-1">
        {shot.status === "error" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 rounded-lg sm:min-h-8"
            onClick={onRetry}
            disabled={disabled}
            aria-label={t("form.upload.retryLabel", { n })}
          >
            <RotateCw className="size-4" aria-hidden="true" />
            {t("form.upload.retry")}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconButton}
              onClick={onMakeCover}
              disabled={disabled || isCover || isBusy}
              aria-label={t("form.upload.makeCover", { n })}
            >
              <Star className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconButton}
              onClick={() => onMove(-1)}
              disabled={disabled || index === 0}
              aria-label={t("form.upload.moveLeft", { n })}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconButton}
              onClick={() => onMove(1)}
              disabled={disabled || index === count - 1}
              aria-label={t("form.upload.moveRight", { n })}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(iconButton, "ml-auto")}
          onClick={onRemove}
          disabled={disabled}
          aria-label={t("form.upload.remove", { n })}
          data-remove-shot={index}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

export function LinksMediaStep({
  websiteUrl,
  setWebsiteUrl,
  faviconUrl,
  setFaviconUrl,
  selectedTags,
  setSelectedTags,
  shots,
  uploadNotice,
  uploadsBusyMessage,
  onAddFiles,
  onRetryShot,
  onRemoveShot,
  onMakeCover,
  onMoveShot,
  errors,
  onFieldBlur,
  disabled,
}: LinksMediaStepProps) {
  const { t } = useTranslation("projectSubmit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [brokenFavicon, setBrokenFavicon] = useState<string | null>(null);
  // Counted, so dragging over a child does not flicker the state.
  const dragDepth = useRef(0);

  const trimmedWebsiteUrl = websiteUrl.trim();
  const normalizedWebsiteUrl = normalizeProjectWebsiteUrl(websiteUrl);
  const savedAs =
    normalizedWebsiteUrl && normalizedWebsiteUrl !== trimmedWebsiteUrl
      ? normalizedWebsiteUrl
      : null;
  const faviconPreview =
    faviconUrl.trim() || (normalizedWebsiteUrl ? getFaviconUrl(normalizedWebsiteUrl) : "");
  const isFull = shots.length >= MAX_SCREENSHOTS;

  const pickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAddFiles(Array.from(files));
  };

  const removeAndRefocus = (id: string, index: number) => {
    onRemoveShot(id);
    // Keep focus in the list: the next tile's remove button, or the dropzone.
    setTimeout(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[data-remove-shot]");
      const target = buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)];
      (target ?? document.getElementById(SCREENSHOTS_DROPZONE_ID))?.focus();
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="website_url" optional>
          {t("form.websiteUrl")}
        </FieldLabel>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder={t("form.websitePlaceholder")}
          className={cn(authInputClassName, "mt-2")}
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          onBlur={() => onFieldBlur("website_url")}
          disabled={disabled}
          {...fieldAria("website_url", errors)}
        />
        <FieldFooter
          field="website_url"
          hint={savedAs ? t("form.websiteSavedAs", { url: savedAs }) : t("form.websiteHint")}
          error={errors.website_url}
        />
      </div>

      <div>
        <FieldLabel htmlFor="favicon_url" optional>
          {t("form.faviconUrl")}
        </FieldLabel>
        <div className="relative mt-2">
          {faviconPreview &&
            (faviconPreview === brokenFavicon ? (
              <Globe
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
            ) : (
              <Image
                src={faviconPreview}
                alt=""
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2"
                width={16}
                height={16}
                onError={() => setBrokenFavicon(faviconPreview)}
              />
            ))}
          <Input
            id="favicon_url"
            name="favicon_url"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={t("form.faviconPlaceholder")}
            className={cn(authInputClassName, faviconPreview && "pl-10")}
            value={faviconUrl}
            onChange={(e) => setFaviconUrl(e.target.value)}
            onBlur={() => onFieldBlur("favicon_url")}
            disabled={disabled}
            {...fieldAria("favicon_url", errors)}
          />
        </div>
        <FieldFooter field="favicon_url" hint={t("form.faviconHint")} error={errors.favicon_url} />
      </div>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops Enter in the tag input from submitting the form. */}
      <div
        onKeyDown={(e) => {
          // Enter adds a tag here. It must not also submit the form.
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        {/* cmdk sets its own input id and hidden label (commandProps.label), so this label is visual only. */}
        <FieldLabel>{t("form.techStack")}</FieldLabel>
        <div id={TAGS_FIELD_ID} className="mt-2">
          <MultipleSelector
            value={selectedTags}
            onChange={setSelectedTags}
            defaultOptions={techOptions}
            placeholder={t("form.techStackPlaceholder")}
            emptyIndicator={
              <p className="text-center text-sm text-muted-foreground">
                {t("form.techStackEmpty")}
              </p>
            }
            creatable
            maxSelected={PROJECT_LIMITS.MAX_TAG_COUNT}
            disabled={disabled}
            className={cn(
              "min-h-12 rounded-xl bg-muted/30 text-base",
              errors.tags && "border-destructive",
            )}
            commandProps={{ label: t("form.techStack") }}
            inputProps={{
              onBlur: () => onFieldBlur("tags"),
              enterKeyHint: "enter",
              ...fieldAria("tags", errors),
            }}
          />
        </div>
        <FieldFooter field="tags" hint={t("form.tagsHint")} error={errors.tags} />
      </div>

      <fieldset aria-describedby={hintId("image_urls")}>
        <legend className="text-sm font-medium">
          {t("form.screenshotCount", { count: shots.length, max: MAX_SCREENSHOTS })}
        </legend>
        <p id={hintId("image_urls")} className="mt-1 text-sm text-muted-foreground">
          {t("form.screenshotHint")}
        </p>

        {shots.length > 0 && (
          <ul ref={listRef} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {shots.map((shot, index) => (
              <ShotTile
                key={shot.id}
                shot={shot}
                index={index}
                count={shots.length}
                disabled={disabled}
                onRetry={() => onRetryShot(shot.id)}
                onRemove={() => removeAndRefocus(shot.id, index)}
                onMakeCover={() => onMakeCover(shot.id)}
                onMove={(delta) => onMoveShot(shot.id, delta)}
              />
            ))}
          </ul>
        )}

        {isFull ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("form.upload.full")}</p>
        ) : (
          <>
            <button
              id={SCREENSHOTS_DROPZONE_ID}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                dragDepth.current += 1;
                setIsDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => {
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (dragDepth.current === 0) setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                dragDepth.current = 0;
                setIsDragging(false);
                if (!disabled) pickFiles(e.dataTransfer.files);
              }}
              disabled={disabled}
              aria-invalid={errors.image_urls ? true : undefined}
              aria-describedby={
                errors.image_urls ? `${hintId("image_urls")} ${errorId("image_urls")}` : undefined
              }
              className={cn(
                "mt-3 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150 ease-out hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
                errors.image_urls && "border-destructive",
              )}
            >
              <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">
                {isDragging ? t("form.upload.dropActive") : t("form.upload.dropzone")}
              </span>
              <span className="text-xs text-muted-foreground">{t("form.upload.dropzoneHint")}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              data-testid="screenshot-file-input"
              onChange={(e) => {
                pickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        )}

        {uploadNotice && (
          <FieldMessage id="screenshots-notice" tone="info">
            {uploadNotice}
          </FieldMessage>
        )}
        {uploadsBusyMessage && (
          <FieldMessage id="screenshots-busy" tone="error">
            {uploadsBusyMessage}
          </FieldMessage>
        )}
        <FieldFooter field="image_urls" error={errors.image_urls} />
      </fieldset>
    </div>
  );
}
