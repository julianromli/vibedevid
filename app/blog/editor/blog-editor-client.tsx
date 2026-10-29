"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BlogGuideModal } from "@/components/blog/blog-guide-modal";
import { CoverImageUploader } from "@/components/blog/cover-image-uploader";
import { PreviewDialog } from "@/components/blog/preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector, { type Option } from "@/components/ui/multiselect";
import { Navbar } from "@/components/ui/navbar";
import { createBlogPostFn, getTagsFn, updateBlogPostFn } from "@/lib/actions/blog.functions";
import { useRouter } from "@/lib/navigation";
import type { User } from "@/types/homepage";

const NovelEditor = lazy(() =>
  import("@/components/blog/novel-editor").then((mod) => ({
    default: mod.NovelEditor,
  })),
);

function EditorSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border bg-card">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  );
}

type EditorJson = Record<string, unknown>;

interface EditorRef {
  getContent: () => EditorJson;
  setContent: (content: EditorJson) => void;
}

/** The post being edited, as the edit route loads it. */
interface BlogEditorInitialData {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  cover_image?: string | null;
  content?: unknown;
  tags?: string[];
}

interface BlogEditorClientProps {
  user: User;
  initialData?: BlogEditorInitialData;
  mode?: "create" | "edit";
}

function parseHttpOrHttpsUrl(rawUrl: string): { url: string; isHttp: boolean } | null {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return { url: parsed.toString(), isHttp: parsed.protocol === "http:" };
  } catch {
    return null;
  }
}

export default function BlogEditorClient({
  user,
  initialData,
  mode = "create",
}: BlogEditorClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<EditorRef>(null);

  // Tags state
  const [selectedTags, setSelectedTags] = useState<Option[]>(
    initialData?.tags?.map((t) => ({ label: t, value: t })) || [],
  );

  // Memoize content for preview
  const [currentContent, setCurrentContent] = useState<EditorJson>(
    (initialData?.content as EditorJson | undefined) || { type: "doc", content: [] },
  );

  const initialEditorContent = useMemo(
    () => (initialData?.content as EditorJson | undefined) || { type: "doc", content: [] },
    [initialData],
  );

  useEffect(() => {
    console.log("[BlogEditorClient] User authenticated:", user.id);
  }, [user]);

  const handleSave = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: existing function over the limit; split it in its own refactor
    async (status: "published" | "draft") => {
      if (!title.trim()) {
        toast.error("Please add a title");
        return;
      }

      if (isUploadingCover) {
        toast.error("Please wait for cover upload to finish");
        return;
      }

      const trimmedCoverImage = coverImage.trim();
      const parsedCoverImageUrl = trimmedCoverImage ? parseHttpOrHttpsUrl(trimmedCoverImage) : null;

      if (trimmedCoverImage && !parsedCoverImageUrl) {
        toast.error("Cover image URL must be http(s)");
        return;
      }

      if (parsedCoverImageUrl?.isHttp) {
        toast.info("Cover image uses http:// and may fail to load on HTTPS");
      }

      const editorContent = editorRef.current?.getContent() ?? {
        type: "doc",
        content: [],
      };

      // Log content before saving for debugging
      console.log(
        "[BlogEditorClient] Content before save:",
        JSON.stringify(editorContent, null, 2),
      );

      const contentJson = JSON.stringify(editorContent);
      const minLength = status === "draft" ? 10 : 100;
      if (contentJson.length < minLength) {
        toast.error("Content is too short");
        return;
      }

      setSaving(true);

      try {
        let result:
          | Awaited<ReturnType<typeof createBlogPostFn>>
          | Awaited<ReturnType<typeof updateBlogPostFn>>;
        const postData = {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: contentJson,
          cover_image: parsedCoverImageUrl?.url || undefined,
          status,
          tags: selectedTags.map((t) => t.label),
        };

        if (mode === "edit" && initialData?.id) {
          result = await updateBlogPostFn({
            data: { id: initialData.id, data: postData },
          });
        } else {
          result = await createBlogPostFn({ data: postData });
        }

        if (result.success) {
          toast.success(status === "published" ? "Post published!" : "Draft saved!");

          const finalSlug = result.slug || initialData?.slug;
          console.log("[BlogEditor] Redirecting with slug:", finalSlug);

          if (mode === "create") {
            if (status === "published") {
              router.navigate({ to: `/blog/${finalSlug}` });
            } else {
              router.navigate({ to: "/dashboard/posts" });
            }
          } else {
            if (status === "published") {
              router.navigate({ to: `/blog/${finalSlug}` });
            }
          }
        } else {
          toast.error(result.error ?? "Failed to save");
        }
      } catch (_error) {
        toast.error("Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [title, excerpt, coverImage, isUploadingCover, router, mode, initialData, selectedTags],
  );

  const handleEditorChange = useCallback((json: EditorJson) => {
    setCurrentContent(json);
  }, []);

  const handleTagSearch = async (query: string): Promise<Option[]> => {
    const tags = await getTagsFn({ data: { query } });
    return tags.map((t) => ({ label: t.name, value: t.name }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={true} user={user} />

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-bold text-3xl">{mode === "edit" ? "Edit Post" : "Write a Post"}</h1>
            <div className="flex gap-3">
              <PreviewDialog
                post={{
                  title,
                  excerpt,
                  cover_image: coverImage,
                  content: currentContent,
                  author: {
                    display_name: user.name,
                    avatar_url: user.avatar,
                  },
                }}
              />
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={saving || isUploadingCover}
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => handleSave("published")} disabled={saving || isUploadingCover}>
                {saving ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>

          <div className="space-y-6" data-editor>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your post a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-semibold text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Input
                id="excerpt"
                placeholder="A brief summary of your post"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <MultipleSelector
                value={selectedTags}
                onChange={setSelectedTags}
                onSearch={handleTagSearch}
                placeholder="Add tags..."
                creatable
                emptyIndicator={
                  <p className="text-center text-muted-foreground text-sm">No tags found.</p>
                }
              />
            </div>

            <CoverImageUploader
              value={coverImage}
              onChange={setCoverImage}
              isUploading={isUploadingCover}
              onUploadStart={() => setIsUploadingCover(true)}
              onUploadComplete={(url) => {
                setIsUploadingCover(false);
                setCoverImage(url);
                toast.success("Cover image uploaded");
              }}
              onUploadError={(error: Error) => {
                setIsUploadingCover(false);
                toast.error(`Upload failed: ${error.message}`);
              }}
              disabled={saving}
            />

            <div className="space-y-2">
              <Label>Content</Label>
              <Suspense fallback={<EditorSkeleton />}>
                <NovelEditor
                  ref={editorRef}
                  content={initialEditorContent}
                  onChange={handleEditorChange}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <BlogGuideModal />
    </div>
  );
}
