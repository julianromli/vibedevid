"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeartButton } from "@/components/ui/heart-button";
import { ProminentLikeButton } from "@/components/ui/prominent-like-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { UploadButton } from "@uploadthing/react";
import { getCategories, type Category } from "@/lib/categories";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  MessageCircle,
  Calendar,
  User,
  Globe,
  Tag,
  Loader2,
  Edit,
  Trash2,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/navbar";

// Safe favicon component with error state tracking
const ProjectFavicon = ({
  src,
  alt,
  className,
  width,
  height,
}: {
  src?: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}) => {
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || "/default-favicon.svg");

  // Reset error state when src changes
  useEffect(() => {
    if (src && src !== imgSrc) {
      setHasError(false);
      setImgSrc(src);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      console.log('[Favicon Error] Failed to load:', imgSrc, 'falling back to default');
      setHasError(true);
      setImgSrc("/default-favicon.svg");
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      priority={false}
    />
  );
};
import {
  ProjectImageSkeleton,
  ProjectInfoSkeleton,
  CommentsSkeleton,
  ProjectStatsSkeleton,
} from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  getProjectBySlug,
  getComments,
  addComment,
  incrementProjectViews,
  editProject,
  deleteProject,
} from "@/lib/actions";
import { getFaviconUrl } from "@/lib/favicon-utils";
import {
  getCurrentSessionId,
  shouldTrackView,
  isValidUserAgent,
} from "@/lib/client-analytics";
import { useRouter } from "next/navigation";

// Common tech stack options for the multiselect
const MAX_DESCRIPTION_LENGTH = 300;

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

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [projectSlug, setProjectSlug] = useState<string | null>(null);
  const [project, setProject] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    tagline: "",
    category: "",
    website_url: "",
    image_url: "",
  });
  // Edit form specific states
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedEditTags, setSelectedEditTags] = useState<Option[]>([]);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState<string>("");
  const [editFaviconUrl, setEditFaviconUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Real-time stats states
  const [realTimeLikes, setRealTimeLikes] = useState(0);
  const [realTimeViews, setRealTimeViews] = useState(0);
  const [realTimeUniqueViews, setRealTimeUniqueViews] = useState(0);
  const [realTimeTodayViews, setRealTimeTodayViews] = useState(0);

  // Optimized: Single useEffect for all initialization logic
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMounted(true);

    const initializePageOptimized = async () => {
      try {
        const resolvedParams = await params;
        const slugOrId = resolvedParams.slug;
        
        // Check if this is a legacy UUID redirect
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(slugOrId)) {
          // This is a legacy UUID, redirect to slug
          console.log('[Legacy Redirect] Detected UUID:', slugOrId);
          const supabase = createClient();
          const { data: project } = await supabase
            .from("projects")
            .select("slug")
            .eq("id", slugOrId)
            .single();
          
          if (project?.slug) {
            console.log('[Legacy Redirect] Redirecting to slug:', project.slug);
            router.replace(`/project/${project.slug}`);
            return;
          } else {
            console.log('[Legacy Redirect] Project not found, redirecting to home');
            router.replace("/");
            return;
          }
        }
        
        // Normal slug flow
        const currentProjectSlug = slugOrId;
        setProjectSlug(currentProjectSlug);

        const supabase = createClient();

        // Parallel operations for better performance
        const [
          {
            data: { session },
          },
          { project: projectData, error: projectError },
        ] = await Promise.all([
          await supabase.auth.getSession(),
          getProjectBySlug(currentProjectSlug),
        ]);

        if (projectError) {
          console.error("Failed to load project:", projectError);
          setLoading(false);
          return;
        }

        // Batch state updates to prevent multiple re-renders
        let authUser = null;
        let isOwner = false;

        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            authUser = {
              id: session.user.id,
              name: profile.display_name,
              avatar: profile.avatar_url || "/placeholder.svg",
              username: profile.username,
            };
          }

          // Check ownership parallel with profile fetch
          if (projectData) {
            const { data: authorData } = await supabase
              .from("users")
              .select("id")
              .eq("username", projectData.author.username)
              .single();

            isOwner = authorData && authorData.id === session.user.id;
          }
        }

        // Enhanced view tracking with session-based analytics
        if (isValidUserAgent() && shouldTrackView(currentProjectSlug)) {
          const sessionId = getCurrentSessionId();
          console.log(
            "[View Tracking] Tracking view for project:",
            currentProjectSlug,
            "Session:",
            sessionId
          );
          await incrementProjectViews(currentProjectSlug, sessionId);
        }

        // Fire and forget operations (non-blocking)
        loadComments(currentProjectSlug);

        // Batch all state updates
        setIsLoggedIn(!!session?.user);
        if (authUser) setCurrentUser(authUser);
        setProject(projectData);
        setIsProjectOwner(isOwner);
        setRealTimeLikes(projectData?.likes || 0); // Initialize real-time likes
        setRealTimeViews(projectData?.views || 0); // Initialize real-time views
        setRealTimeUniqueViews(projectData?.uniqueViews || 0); // Initialize unique views
        setRealTimeTodayViews(projectData?.todayViews || 0); // Initialize today's views
        setLoading(false);

        // Smooth scroll after content is loaded
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Page initialization error:", error);
        setLoading(false);
      }
    };

    initializePageOptimized();
  }, [params]);

  const loadComments = async (projectSlugParam?: string) => {
    const slugToUse = projectSlugParam || projectSlug;
    if (!slugToUse) return;

    setCommentsLoading(true);
    const { comments: commentsData, error } = await getComments(slugToUse);
    if (error) {
      console.error("Failed to load comments:", error);
    } else {
      setComments(commentsData);
    }
    setCommentsLoading(false);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = project?.title || "Check out this project";

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title
          )}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        break;
    }
    setShowShareMenu(false);
  };

  const handleAddComment = async () => {
    if (
      !newComment.trim() ||
      (!isLoggedIn && !guestName.trim()) ||
      !projectSlug
    ) {
      return;
    }

    setAddingComment(true);

    const formData = new FormData();
    formData.append("projectSlug", projectSlug);
    formData.append("content", newComment.trim());
    if (!isLoggedIn) {
      formData.append("authorName", guestName.trim());
    }

    const result = await addComment(formData);

    if (result.error) {
      console.error("Failed to add comment:", result.error);
      alert("Failed to add comment. Please try again.");
    } else {
      setNewComment("");
      if (!isLoggedIn) {
        setGuestName("");
      }
      await loadComments();
    }

    setAddingComment(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfile = () => {
    if (currentUser?.username) {
      router.push(`/${currentUser.username}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectSlug) return;

    setIsDeleting(true);
    const result = await deleteProject(projectSlug);

    if (result.success) {
      router.push("/");
    } else {
      alert(result.error || "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const handleEditProject = async () => {
    // Load categories if not already loaded
    if (categories.length === 0) {
      setLoadingCategories(true);
      try {
        const dbCategories = await getCategories();
        setCategories(dbCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }

    // Initialize form data with existing project data
    setEditFormData({
      title: project?.title || "",
      description: project?.description || "",
      tagline: project?.tagline || "",
      category: project?.categoryRaw || "", // Use raw category name for form select
      website_url: project?.url || "",
      image_url: project?.image || "",
    });

    // Initialize tech stack tags
    const existingTags = project?.tags
      ? project.tags.map((tag) => ({ value: tag, label: tag }))
      : [];
    setSelectedEditTags(existingTags);

    // Initialize website URL and favicon
    setEditWebsiteUrl(project?.url || "");
    setEditFaviconUrl(project?.faviconUrl || "");

    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!projectSlug) return;

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("description", editFormData.description);
      formData.append("tagline", editFormData.tagline);
      formData.append("category", editFormData.category);
      formData.append("website_url", editWebsiteUrl);
      formData.append("image_url", editFormData.image_url);
      formData.append("favicon_url", editFaviconUrl);

      // Add selected tags as JSON string
      const tagsValues = selectedEditTags.map((tag) => tag.value);
      formData.append("tags", JSON.stringify(tagsValues));

      const result = await editProject(projectSlug, formData);

      if (result.success) {
        const { project: updatedProject } = await getProjectBySlug(projectSlug);
        if (updatedProject) {
          setProject(updatedProject);
        }
        setIsEditing(false);
        // Reset edit form states
        setSelectedEditTags([]);
        setEditWebsiteUrl("");
        setEditFaviconUrl("");
      } else {
        alert(result.error || "Failed to update project");
      }
    } catch (error) {
      alert("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      title: "",
      description: "",
      category: "",
      website_url: "",
      image_url: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar showBackButton={true} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Image Skeleton */}
              <ProjectImageSkeleton />

              {/* Project Info Skeleton */}
              <ProjectInfoSkeleton />

              {/* Comments Skeleton */}
              <CommentsSkeleton />
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <ProjectStatsSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar showBackButton={true} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Project Not Found
            </h1>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar
        showBackButton={true}
        isLoggedIn={isLoggedIn}
        user={currentUser || undefined}
        onSignOut={handleSignOut}
        onProfile={handleProfile}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Image */}
            <div className="relative overflow-hidden rounded-xl bg-muted">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  fill
                  priority
                  className="w-full h-full object-cover transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </AspectRatio>
            </div>

            {/* Project Info */}
            {isEditing ? (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Edit Project</h3>
                  <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-title" className="form-label-enhanced">Project Title *</Label>
                      <Input
                        id="edit-title"
                        value={editFormData.title}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter project title"
                        className="form-input-enhanced"
                        disabled={isSaving}
                      />
                    </div>

                    {/* Tagline */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-tagline" className="form-label-enhanced">Tagline</Label>
                      <Input
                        id="edit-tagline"
                        value={editFormData.tagline}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            tagline: e.target.value,
                          })
                        }
                        placeholder="A short tagline that describes your project in one sentence"
                        className="form-input-enhanced"
                        disabled={isSaving}
                      />
                      <p className="text-xs form-helper-text mt-1">
                        Tagline singkat yang describe project lo dalam satu
                        kalimat! ✨
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="form-label-enhanced">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your project, its features, and what makes it special"
                        className="form-input-enhanced"
                        rows={4}
                        disabled={isSaving}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">
                          Description maksimal 300 karakter untuk konsistensi!
                          📝
                        </p>
                        <span
                          className={`font-medium ${
                            editFormData.description.length >
                            MAX_DESCRIPTION_LENGTH
                              ? "text-red-500"
                              : editFormData.description.length > 250
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                          }`}>
                          {editFormData.description.length}/
                          {MAX_DESCRIPTION_LENGTH}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select
                        value={editFormData.category}
                        onValueChange={(value) =>
                          setEditFormData({ ...editFormData, category: value })
                        }
                        disabled={isSaving || loadingCategories}>
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
                              <SelectItem
                                key={category.id}
                                value={category.name}>
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

                    {/* Website URL */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-website">Website URL</Label>
                      <Input
                        id="edit-website"
                        type="url"
                        value={editWebsiteUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setEditWebsiteUrl(url);
                          setEditFormData({
                            ...editFormData,
                            website_url: url,
                          });
                        }}
                        placeholder="https://your-project.com"
                        disabled={isSaving}
                      />
                    </div>

                    {/* Favicon URL with Preview */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-favicon">Favicon URL</Label>
                      <div className="flex items-center gap-2">
                        {(editFaviconUrl || (editWebsiteUrl && getFaviconUrl(editWebsiteUrl))) && (
                          <Image
                            src={editFaviconUrl || getFaviconUrl(editWebsiteUrl)}
                            alt="Website favicon"
                            className="w-4 h-4 flex-shrink-0"
                            onError={() => setEditFaviconUrl("")}
                            width={16}
                            height={16}
                          />
                        )}
                        <Input
                          id="edit-favicon"
                          type="url"
                          value={editFaviconUrl}
                          onChange={(e) => setEditFaviconUrl(e.target.value)}
                          placeholder={editWebsiteUrl ? "Auto-fetch dari website atau manual URL" : "https://example.com/favicon.ico atau https://example.com/favicon.svg"}
                          disabled={isSaving}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {editWebsiteUrl 
                          ? "Favicon akan otomatis ke-fetch dari website ini! 🌐 Atau masukkan URL manual untuk override."
                          : "Masukkan URL favicon manual untuk project lo! Icon kecil yang muncul di browser tab 🎯"}
                      </p>
                    </div>

                    {/* Tech Stack / Tags */}
                    <div className="space-y-2">
                      <Label>Tech Stack / Tags</Label>
                      <MultipleSelector
                        value={selectedEditTags}
                        onChange={setSelectedEditTags}
                        defaultOptions={techOptions}
                        placeholder="Select technologies used in your project..."
                        emptyIndicator={
                          <p className="text-center text-sm text-muted-foreground">
                            No technologies found.
                          </p>
                        }
                        creatable
                        maxSelected={10}
                        disabled={isSaving}
                        commandProps={{
                          label: "Select tech stack",
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Pilih teknologi yang lo pakai di project ini. Bisa
                        nambah sendiri kalau gak ada! 🚀
                      </p>
                    </div>

                    {/* Project Image Upload */}
                    <div className="space-y-2">
                      <Label>Project Screenshot</Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                        {editFormData.image_url ? (
                          <div className="space-y-4">
                            <div className="relative">
                              <AspectRatio ratio={16 / 9}>
                                <Image
                                  src={
                                    editFormData.image_url || "/placeholder.svg"
                                  }
                                  alt="Project screenshot preview"
                                  fill
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  className="w-full h-full object-cover rounded-lg shadow-md"
                                />
                              </AspectRatio>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    image_url: "",
                                  });
                                }}
                                disabled={isSaving}>
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
                                    Please wait while your image is being
                                    uploaded
                                  </p>
                                </div>
                              ) : (
                                <UploadButton
                                  endpoint="projectImageUploader"
                                  onUploadBegin={(name) => {
                                    console.log(
                                      "[v0] Upload started for file:",
                                      name
                                    );
                                    setIsUploading(true);

                                    // Clear existing timeout if any
                                    if (uploadTimeout) {
                                      clearTimeout(uploadTimeout);
                                    }

                                    // Set a fallback timeout to prevent stuck state (30 seconds)
                                    const timeoutId = setTimeout(() => {
                                      console.log(
                                        "[v0] Upload timeout - resetting state"
                                      );
                                      setIsUploading(false);
                                    }, 30000);

                                    setUploadTimeout(timeoutId);
                                  }}
                                  onClientUploadComplete={(res) => {
                                    console.log(
                                      "[v0] Client upload completed:",
                                      res
                                    );

                                    // Clear timeout since upload completed
                                    if (uploadTimeout) {
                                      clearTimeout(uploadTimeout);
                                      setUploadTimeout(null);
                                    }

                                    // Always set uploading to false first
                                    setIsUploading(false);

                                    // Check if we have a valid response
                                    if (
                                      res &&
                                      Array.isArray(res) &&
                                      res.length > 0
                                    ) {
                                      const uploadResult = res[0];
                                      const imageUrl =
                                        uploadResult.url ||
                                        uploadResult.fileUrl ||
                                        uploadResult.key;

                                      if (imageUrl) {
                                        console.log(
                                          "[v0] Setting image URL:",
                                          imageUrl
                                        );
                                        setEditFormData((prevData) => ({
                                          ...prevData,
                                          image_url: imageUrl,
                                        }));
                                      }
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
                                  }}
                                  config={{
                                    mode: "auto",
                                  }}
                                  content={{
                                    button({ ready }) {
                                      if (ready) return <div>Choose File</div>;
                                      return "Getting ready...";
                                    },
                                    allowedContent({
                                      ready,
                                      fileTypes,
                                      isUploading,
                                    }) {
                                      if (!ready)
                                        return "Checking what you allow";
                                      if (isUploading) return "Uploading...";
                                      return `Image (${fileTypes.join(", ")})`;
                                    },
                                  }}
                                  appearance={{
                                    button:
                                      "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md",
                                    allowedContent:
                                      "text-sm text-muted-foreground mt-2",
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

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={
                          !editFormData.title.trim() ||
                          !editFormData.description.trim() ||
                          editFormData.description.length >
                            MAX_DESCRIPTION_LENGTH ||
                          isSaving
                        }>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {project.category}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {isMounted && project?.createdAt
                      ? new Date(project.createdAt).toLocaleDateString()
                      : "Loading..."}
                  </span>
                </div>

                {/* Favicon + Title + Tagline with Like Button */}
                  <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <ProjectFavicon
                        src={project.faviconUrl}
                        alt="Project favicon"
                        className="w-12 h-12 rounded-lg"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold text-foreground leading-tight mb-1">
                        {project.title}
                      </h1>
                      {project.tagline && (
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {project.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Like Button - positioned on the right */}
                  <div className="flex-shrink-0 self-start">
                    <ProminentLikeButton
                      projectId={project.slug}
                      initialLikes={project.likes}
                      isLoggedIn={isLoggedIn}
                      onLikeChange={(newLikes, isLiked) => {
                        console.log(
                          `Project ${project.slug} ${
                            isLiked ? "liked" : "unliked"
                          }: ${newLikes} likes`
                        );
                        setRealTimeLikes(newLikes);
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {project.description}
                  </p>
                </div>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Project URL */}
                {project.url && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Live Project</p>
                            <p className="text-sm text-muted-foreground">
                              {project.url}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(project.url, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Site
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Add Comment */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {!isLoggedIn && (
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Your name"
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        isLoggedIn
                          ? `Share your thoughts about this project, ${currentUser?.name}...`
                          : "Share your thoughts about this project..."
                      }
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={
                          !newComment.trim() ||
                          (!isLoggedIn && !guestName.trim()) ||
                          addingComment
                        }>
                        {addingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          "Post Comment"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <OptimizedAvatar
                            src={comment.avatar}
                            alt={comment.author}
                            size="sm"
                            isGuest={comment.isGuest}
                            showSkeleton={true}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.author}
                              </span>
                              {comment.isGuest && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  Guest
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <OptimizedAvatar
                      src={project.author.avatar}
                      alt={project.author.name}
                      size="xl"
                      showSkeleton={true}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{project.author.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.author.bio}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <User className="h-3 w-3" />
                      {project.author.location}
                    </p>
                  </div>
                  <Link href={`/${project.author.username}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Views</span>
                    <span className="font-medium">
                      {realTimeViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Unique Visitors
                    </span>
                    <span className="font-medium">
                      {realTimeUniqueViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Today's Views</span>
                    <span className="font-medium">{realTimeTodayViews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Likes</span>
                    <span className="font-medium">{realTimeLikes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Actions & Share */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isProjectOwner && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleEditProject}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Project
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete your project "{project?.title}"
                              and remove all associated data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProject}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete Project"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {/* Share Button */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setShowShareMenu(!showShareMenu)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Project
                    </Button>

                    {showShareMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-10">
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => handleShare("twitter")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
                            Share on Twitter
                          </button>
                          <button
                            onClick={() => handleShare("linkedin")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
                            Share on LinkedIn
                          </button>
                          <button
                            onClick={() => handleShare("copy")}
                            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
                            Copy Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
