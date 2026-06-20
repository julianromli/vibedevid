import { UploadButton } from "@uploadthing/react";
import { CheckCircle, Loader2, X } from "lucide-react";
import { Image } from "@unpic/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import { getFaviconUrl } from "@/lib/favicon-utils";
import { compressImageFiles } from "@/lib/image-compression";
import { normalizeProjectWebsiteUrl } from "@/lib/project-url";
import type { OurFileRouter } from "@/lib/uploadthing-router";
import type { UploadResult } from "@/components/ui/submit-project-form/types";

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

function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(url.hostname) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export interface LinksMediaStepProps {
  websiteUrl: string;
  setWebsiteUrl: (value: string) => void;
  faviconUrl: string;
  setFaviconUrl: (value: string) => void;
  selectedTags: Option[];
  setSelectedTags: (value: Option[]) => void;
  uploadedImageUrls: string[];
  setUploadedImageUrls: (value: string[] | ((prev: string[]) => string[])) => void;
  uploadedImageKeys: string[];
  setUploadedImageKeys: (value: string[] | ((prev: string[]) => string[])) => void;
  importedImageUrl: string;
  setImportedImageUrl: (value: string) => void;
  isLoading: boolean;
  isUploading: boolean;
  onUploadBegin: (name: string) => void;
  onUploadComplete: (res: UploadResult[] | undefined) => void;
  onUploadError: (error: Error) => void;
}

export function LinksMediaStep({
  websiteUrl,
  setWebsiteUrl,
  faviconUrl,
  setFaviconUrl,
  selectedTags,
  setSelectedTags,
  uploadedImageUrls,
  setUploadedImageUrls,
  uploadedImageKeys,
  setUploadedImageKeys,
  importedImageUrl,
  setImportedImageUrl,
  isLoading,
  isUploading,
  onUploadBegin,
  onUploadComplete,
  onUploadError,
}: LinksMediaStepProps) {
  const trimmedWebsiteUrl = websiteUrl.trim();
  const normalizedWebsiteUrl = normalizeProjectWebsiteUrl(websiteUrl);
  const normalizedWebsitePreview =
    normalizedWebsiteUrl && normalizedWebsiteUrl !== trimmedWebsiteUrl
      ? normalizedWebsiteUrl
      : null;

  const activeImageUrls =
    uploadedImageUrls.length > 0 ? uploadedImageUrls : importedImageUrl ? [importedImageUrl] : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="website_url" className="form-label-enhanced">
          Website URL
        </Label>
        <Input
          id="website_url"
          name="website_url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="your-project.com"
          className="form-input-enhanced"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          disabled={isLoading || isUploading}
        />
        <p className="form-helper-text mt-1 text-xs">
          {!trimmedWebsiteUrl
            ? "Optional. You can paste a full URL or just type google.com and we\u2019ll save it as https://google.com."
            : normalizedWebsitePreview
              ? `Will be saved as ${normalizedWebsitePreview}`
              : isValidWebsiteUrl(websiteUrl)
                ? "Looking good! ✨"
                : "Enter a valid website URL or leave it empty"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="favicon_url" className="form-label-enhanced">
          Favicon URL
        </Label>
        <div className="flex items-center gap-2">
          {(faviconUrl || (websiteUrl && getFaviconUrl(websiteUrl))) && (
            <Image
              src={faviconUrl || getFaviconUrl(websiteUrl)}
              alt="Website favicon"
              className="h-4 w-4 flex-shrink-0"
              onError={() => setFaviconUrl("")}
              width={16}
              height={16}
            />
          )}
          <Input
            id="favicon_url"
            name="favicon_url"
            type="url"
            placeholder={
              websiteUrl
                ? "Auto-fetch dari website atau manual URL"
                : "https://example.com/favicon.ico atau https://example.com/favicon.svg"
            }
            className="form-input-enhanced"
            value={faviconUrl}
            onChange={(e) => setFaviconUrl(e.target.value)}
            disabled={isLoading || isUploading}
          />
        </div>
        <p className="form-helper-text mt-1 text-xs">
          {websiteUrl
            ? "Favicon akan otomatis ke-fetch dari website ini! 🌐 Atau masukkan URL manual untuk override."
            : "Masukkan URL favicon manual untuk project lo! Icon kecil yang muncul di browser tab 🎯"}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="form-label-enhanced">Tech Stack / Tags</Label>
        <MultipleSelector
          value={selectedTags}
          onChange={setSelectedTags}
          defaultOptions={techOptions}
          placeholder="Select technologies used in your project..."
          emptyIndicator={
            <p className="text-muted-foreground text-center text-sm">No technologies found.</p>
          }
          creatable
          maxSelected={10}
          disabled={isLoading || isUploading}
          commandProps={{ label: "Select tech stack" }}
        />
        <p className="form-helper-text mt-1 text-xs">
          Pilih teknologi yang lo pakai di project ini. Bisa nambah sendiri kalau gak ada! 🚀
        </p>
      </div>

      <div className="space-y-2">
        <Label className="form-label-enhanced">Project Screenshots (up to 10)</Label>
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-600">
          {uploadedImageUrls.length > 0 && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {uploadedImageUrls.map((url, index) => (
                  <div key={url} className="relative">
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={url}
                        alt={`Uploaded screenshot ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover shadow-md"
                        width={300}
                        height={169}
                      />
                    </AspectRatio>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      data-testid={`remove-uploaded-image-${index}`}
                      onClick={() => {
                        setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
                        setUploadedImageKeys((prev) => prev.filter((_, i) => i !== index));
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {uploadedImageUrls.length} uploaded screenshot
                  {uploadedImageUrls.length !== 1 ? "s" : ""} active
                </span>
              </div>
            </div>
          )}

          {importedImageUrl && !uploadedImageUrls.includes(importedImageUrl) && (
            <div className="space-y-4 mb-4">
              <div className="relative opacity-80 border border-muted-foreground/30 rounded-lg overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={importedImageUrl}
                    alt="Imported preview"
                    className="h-full w-full object-cover"
                    width={300}
                    height={169}
                  />
                </AspectRatio>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setImportedImageUrl("")}
                  >
                    Remove Imported Preview
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Using imported preview</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
                  <div className="bg-primary text-primary-foreground rounded-md px-4 py-2 inline-block">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Please wait while your images are being uploaded
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <UploadButton<OurFileRouter, "projectImageUploader">
                    endpoint="projectImageUploader"
                    onBeforeUploadBegin={compressImageFiles}
                    onUploadBegin={onUploadBegin}
                    onClientUploadComplete={onUploadComplete}
                    onUploadError={onUploadError}
                    onUploadProgress={() => {}}
                    config={{ mode: "auto" }}
                    content={{
                      button({ ready }: { ready: boolean }) {
                        if (ready) {
                          const remaining = 10 - uploadedImageUrls.length;
                          return <div>Add More Images ({remaining} left)</div>;
                        }
                        return "Getting ready...";
                      },
                      allowedContent({
                        ready,
                        fileTypes,
                        isUploading: uploadingFlag,
                      }: {
                        ready: boolean;
                        fileTypes: string[];
                        isUploading: boolean;
                      }) {
                        if (!ready) return "Checking what you allow";
                        if (uploadingFlag) return "Uploading...";
                        return `${fileTypes.join(", ")} (max 10 images)`;
                      },
                    }}
                    appearance={{
                      button:
                        "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md",
                      allowedContent: "text-sm text-muted-foreground mt-2",
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload screenshots of your project. You can add up to 10 images.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
