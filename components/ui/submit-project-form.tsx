"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitProject } from "@/lib/actions";
import { Loader2, Upload, X, CheckCircle } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { toast } from "sonner";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getCategories, type Category } from "@/lib/categories";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { getFaviconUrl } from "@/lib/favicon-utils";
import Image from "next/image";

// Common tech stack options for the multiselect
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

interface SubmitProjectFormProps {
  userId: string;
}

const MAX_DESCRIPTION_LENGTH = 300;

export function SubmitProjectForm({ userId }: SubmitProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("/default-favicon.svg");
  const [description, setDescription] = useState<string>("");
  const router = useRouter();

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const dbCategories = await getCategories();
        setCategories(dbCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setError("Failed to load categories. Please refresh the page.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);

      if (uploadedImageUrl) {
        formData.set("image_url", uploadedImageUrl);
      }

      // Add selected tags as JSON string
      const tagsValues = selectedTags.map((tag) => tag.value);
      formData.set("tags", JSON.stringify(tagsValues));

      // Add website URL to form data (for backend favicon fetching)
      if (websiteUrl) {
        formData.set("website_url", websiteUrl);
      }

      const result = await submitProject(formData, userId);
      if (result.success) {
        toast.success("Mantap! 🚀 Project lo berhasil di-submit!");
        router.push(`/project/${result.projectId}`);
      } else {
        toast.error("Waduh, ada error nih! 😅 Coba lagi ya!");
        setError(result.error || "Failed to submit project");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter your project title"
              required
              disabled={isLoading || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              placeholder="A short tagline that describes your project in one sentence"
              disabled={isLoading || isUploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tagline singkat yang describe project lo dalam satu kalimat! ✨
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, its features, and what makes it special"
              rows={4}
              required
              disabled={isLoading || isUploading}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <div className="flex items-center justify-between text-sm">
              <p className="text-xs text-muted-foreground mt-1">
                Description maksimal 300 karakter untuk konsistensi! 📝
              </p>
              <span
                className={`font-medium ${
                  description.length > MAX_DESCRIPTION_LENGTH
                    ? "text-red-500"
                    : description.length > 250
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                }`}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              name="category"
              required
              disabled={isLoading || isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories ? (
                  <SelectItem value="loading" disabled>
                    Loading categories...
                  </SelectItem>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.display_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>
                    No categories available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <div className="flex items-center gap-2">
              {faviconUrl && (
                <Image
                  src={faviconUrl}
                  alt="Website favicon"
                  className="w-4 h-4 flex-shrink-0"
                  onError={() => setFaviconUrl("/default-favicon.svg")}
                  width={16}
                  height={16}
                />
              )}
              <Input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://your-project.com"
                value={websiteUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  setWebsiteUrl(url);
                  // Auto-update favicon preview when URL changes
                  if (url.trim()) {
                    setFaviconUrl(getFaviconUrl(url.trim()));
                  } else {
                    setFaviconUrl("/default-favicon.svg");
                  }
                }}
                disabled={isLoading || isUploading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Favicon akan otomatis ke-fetch dari website ini! 🌐
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tech Stack / Tags</Label>
            <MultipleSelector
              value={selectedTags}
              onChange={setSelectedTags}
              defaultOptions={techOptions}
              placeholder="Select technologies used in your project..."
              emptyIndicator={
                <p className="text-center text-sm text-muted-foreground">
                  No technologies found.
                </p>
              }
              creatable
              maxSelected={10}
              disabled={isLoading || isUploading}
              commandProps={{
                label: "Select tech stack",
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pilih teknologi yang lo pakai di project ini. Bisa nambah sendiri
              kalau gak ada! 🚀
            </p>
          </div>

          <div className="space-y-2">
            <Label>Project Screenshot</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              {uploadedImageUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <AspectRatio ratio={16 / 9}>
                      <Image
                        src={uploadedImageUrl || "/placeholder.svg"}
                        alt="Project screenshot preview"
                        className="w-full h-full object-cover rounded-lg shadow-md"
                        width={16}
                        height={16}
                      />
                    </AspectRatio>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImageUrl("");
                        setError(null);
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Image uploaded successfully!</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {isUploading ? (
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="mt-4">
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                          Uploading...
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Please wait while your image is being uploaded
                        </p>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="projectImageUploader"
                        onUploadBegin={(name) => {
                          console.log("[v0] Upload started for file:", name);
                          setIsUploading(true);
                          setError(null);

                          // Clear existing timeout if any
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout);
                          }

                          // Set a fallback timeout to prevent stuck state (2 minutes)
                          const timeoutId = setTimeout(() => {
                            console.log(
                              "[v0] Upload timeout - resetting state",
                            );
                            setIsUploading(false);
                            setError("Upload timed out. Please try again.");
                          }, 120000);

                          setUploadTimeout(timeoutId);
                        }}
                        onClientUploadComplete={(res) => {
                          console.log("[v0] Client upload completed:", res);
                          console.log(
                            "[v0] Full response object:",
                            JSON.stringify(res, null, 2),
                          );

                          // Clear timeout since upload completed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout);
                            setUploadTimeout(null);
                          }

                          // Always set uploading to false first and clear any previous errors
                          setIsUploading(false);
                          setError(null);

                          // Check if we have a valid response
                          if (res && Array.isArray(res) && res.length > 0) {
                            const uploadResult = res[0];
                            console.log("[v0] Upload result:", uploadResult);

                            // Try to get URL from different possible locations (prioritize new ufsUrl)
                            const imageUrl =
                              uploadResult.ufsUrl ||
                              uploadResult.url ||
                              uploadResult.fileUrl ||
                              uploadResult.key;

                            if (imageUrl) {
                              console.log("[v0] Setting image URL:", imageUrl);
                              setUploadedImageUrl(imageUrl);
                            } else {
                              console.error(
                                "[v0] No URL found in upload result:",
                                uploadResult,
                              );
                              setError(
                                "Upload completed but no URL received. Please try again.",
                              );
                            }
                          } else {
                            console.error("[v0] Invalid response format:", res);
                            setError(
                              "Upload completed but response format is invalid. Please try again.",
                            );
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error("[v0] Upload error:", error);

                          // Clear timeout since upload failed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout);
                            setUploadTimeout(null);
                          }

                          setIsUploading(false);
                          setError(`Upload failed: ${error.message}`);
                        }}
                        onUploadProgress={(progress) => {
                          console.log("[v0] Upload progress:", progress);
                        }}
                        config={{
                          mode: "auto",
                        }}
                        content={{
                          button({ ready }) {
                            if (ready) return <div>Choose File</div>;
                            return "Getting ready...";
                          },
                          allowedContent({ ready, fileTypes, isUploading }) {
                            if (!ready) return "Checking what you allow";
                            if (isUploading) return "Uploading...";
                            return `Image (${fileTypes.join(", ")})`;
                          },
                        }}
                        appearance={{
                          button:
                            "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md",
                          allowedContent: "text-sm text-muted-foreground mt-2",
                        }}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {isUploading
                      ? "Uploading your screenshot..."
                      : "Upload a screenshot of your project (max 4MB)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
