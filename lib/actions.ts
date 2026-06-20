import { revalidatePath } from "@/lib/revalidation";
import { getCategories, getCategoryDisplayName } from "./categories";
import { fetchFavicon } from "./favicon-utils";
import { normalizeProjectWebsiteUrl } from "./project-url";
import { getProjectIdBySlug } from "./slug";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

function toLoggableError(error: unknown): string | Record<string, string | number> {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (error && typeof error === "object") {
    const source = error as Record<string, unknown>;
    const result: Record<string, string | number> = {};

    const stringKeys = ["name", "message", "code", "details", "hint", "statusText"] as const;
    stringKeys.forEach((key) => {
      const value = source[key];
      if (typeof value === "string" && value.trim() !== "") {
        result[key] = value;
      }
    });

    const status = source.status;
    if (typeof status === "number") {
      result.status = status;
    }

    if (Object.keys(result).length > 0) {
      return result;
    }
  }

  return "Unknown error";
}

function isAuthSessionMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const source = error as Record<string, unknown>;
  const name = typeof source.name === "string" ? source.name : "";
  const message = typeof source.message === "string" ? source.message : "";

  return (
    name === "AuthSessionMissingError" || message.toLowerCase().includes("auth session missing")
  );
}

// NOTE: Comment functions have been moved to @/lib/actions/comments.ts
// Use createComment, getComments, reportComment from there instead

export async function getProjectBySlug(slug: string) {
  const supabase = await createClient();

  try {
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return { project: null, error: "Project slug is required" };
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        users:author_id (
          username,
          display_name,
          avatar_url,
          role,
          bio,
          location
        )
      `,
      )
      .eq("slug", slug.trim())
      .single();

    if (projectError) {
      console.error("Get project by slug error:", projectError);
      return { project: null, error: projectError.message };
    }

    if (!project?.users) {
      console.error("Get project error: Author not found");
      return { project: null, error: "Project author not found" };
    }

    const projectPk = project.id;

    const [
      { count: likesCount },
      { count: totalViews },
      { count: uniqueViews },
      { count: todayViews },
    ] = await Promise.all([
      supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectPk),
      supabase
        .from("views")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectPk),
      supabase
        .from("views")
        .select("session_id", { count: "exact", head: true })
        .eq("project_id", projectPk)
        .not("session_id", "is", null),
      supabase
        .from("views")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectPk)
        .eq("view_date", new Date().toISOString().split("T")[0]),
    ]);

    const categoryDisplayName = await getCategoryDisplayName(project.category);

    const formattedProject = {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      fullDescription: project.description,
      image: project.image_url,
      imageUrls: project.image_urls || (project.image_url ? [project.image_url] : []),
      imageKeys: project.image_keys || [],
      author: {
        name: project.users.display_name,
        username: project.users.username,
        role: project.users.role ?? null,
        avatar: project.users.avatar_url || "/placeholder.svg",
        bio: project.users.bio || "Community member",
        location: project.users.location || "Unknown location",
      },
      url: project.website_url,
      category: categoryDisplayName,
      categoryRaw: project.category,
      tagline: project.tagline || "",
      faviconUrl: project.favicon_url || "/default-favicon.svg",
      tags: project.tags || [],
      likes: likesCount || 0,
      views: totalViews || 0,
      uniqueViews: uniqueViews || 0,
      todayViews: todayViews || 0,
      createdAt: project.created_at,
    };

    return { project: formattedProject, error: null };
  } catch (error) {
    console.error("Get project by slug error:", error);
    return { project: null, error: "Failed to load project" };
  }
}

const getPrimaryProjectImage = (project: {
  image_url?: string | null;
  image_urls?: string[] | null;
}): string | null => {
  const firstImageUrl = Array.isArray(project.image_urls)
    ? project.image_urls.find((url) => typeof url === "string" && url)
    : null;
  return firstImageUrl || project.image_url || null;
};

// Legacy function for backward compatibility (will be removed after migration)
export async function getProject(projectId: string) {
  console.warn("[DEPRECATED] getProject() is deprecated. Use getProjectBySlug() instead.");

  // For backward compatibility during migration phase
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("slug")
      .eq("id", projectId)
      .single();

    if (error || !data?.slug) {
      return { project: null, error: "Project not found" };
    }

    return getProjectBySlug(data.slug);
  } catch (error) {
    console.error("Legacy getProject error:", error);
    return { project: null, error: "Failed to load project" };
  }
}

export async function incrementProjectViews(projectSlug: string, sessionId?: string) {
  if (!projectSlug || typeof projectSlug !== "string" || projectSlug.trim() === "") {
    console.error("[Server] incrementProjectViews: projectSlug is required");
    return;
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim());
  if (!projectId) {
    console.error("[Server] incrementProjectViews: Project not found for slug:", projectSlug);
    return;
  }

  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use admin client for view inserts to bypass RLS
  // This allows tracking views for both anonymous and authenticated visitors
  const adminClient = await createAdminClient();

  try {
    // Prepare view record with session-based tracking
    const viewRecord = {
      project_id: projectId, // Use UUID directly, no parseInt
      user_id: user?.id || null,
      session_id: sessionId || null,
      ip_address: null, // We'll skip IP tracking for now
      view_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    };

    console.log(
      "[Server] Incrementing view for project slug:",
      projectSlug,
      "ID:",
      projectId,
      "Session:",
      sessionId,
    );

    const { data, error } = await adminClient.from("views").insert(viewRecord).select();

    if (error) {
      // If it's a duplicate key error, that's expected (user already viewed in this session)
      if (
        error.code === "23505" ||
        error.message?.includes("duplicate") ||
        error.message?.includes("unique")
      ) {
        console.log("[Server] View already tracked for this session");
      } else {
        console.error("[Server] Increment views error:", error);
      }
    } else {
      console.log("[Server] View tracked successfully:", data);
    }
  } catch (error) {
    console.error("[Server] Increment views error:", error);
  }
}

export async function incrementBlogPostViews(postId: string, sessionId?: string) {
  if (!postId || typeof postId !== "string" || postId.trim() === "") {
    console.error("[Server] incrementBlogPostViews: postId is required");
    return;
  }

  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use admin client for view inserts to bypass RLS
  // This allows tracking views for both anonymous and authenticated visitors
  const adminClient = await createAdminClient();

  try {
    // Prepare view record with session-based tracking
    const viewRecord = {
      post_id: postId.trim(),
      user_id: user?.id || null,
      session_id: sessionId || null,
      ip_address: null,
      view_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    };

    console.log("[Server] Incrementing view for blog post:", postId, "Session:", sessionId);

    const { data, error } = await adminClient.from("views").insert(viewRecord).select();

    if (error) {
      // If it's a duplicate key error, that's expected (user already viewed in this session)
      if (
        error.code === "23505" ||
        error.message?.includes("duplicate") ||
        error.message?.includes("unique")
      ) {
        console.log("[Server] Blog view already tracked for this session");
      } else {
        console.error("[Server] Increment blog views error:", error);
      }
    } else {
      console.log("[Server] Blog view tracked successfully:", data);
    }
  } catch (error) {
    console.error("[Server] Increment blog views error:", error);
  }
}

export async function toggleLike(projectId: string) {
  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to like projects" };
  }

  if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
    return { error: "Project ID is required" };
  }

  try {
    // Use UUID directly, no parseInt
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("project_id", projectId.trim())
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { error: checkError.message };
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return { success: true, isLiked: false };
    } else {
      const { error: insertError } = await supabase.from("likes").insert({
        project_id: projectId.trim(), // Use UUID directly
        user_id: user.id,
      });

      if (insertError) {
        return { error: insertError.message };
      }

      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getLikeStatus(projectId: string) {
  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      console.error("Get like status error: projectId is required");
      return { totalLikes: 0, isLiked: false, error: "Project ID is required" };
    }

    // Use UUID directly, no parseInt
    const cleanProjectId = projectId.trim();

    const { count: totalLikes, error: countError } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("project_id", cleanProjectId);

    if (countError) {
      console.error("Get likes count error:", countError.message, countError.details);
      return { totalLikes: 0, isLiked: false, error: countError.message };
    }

    let isLiked = false;
    if (user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from("likes")
        .select("id")
        .eq("project_id", cleanProjectId)
        .eq("user_id", user.id)
        .single();

      if (userLikeError && userLikeError.code !== "PGRST116") {
        console.error("Get user like status error:", userLikeError.message, userLikeError.details);
      } else if (userLike) {
        isLiked = true;
      }
    }

    return { totalLikes: totalLikes || 0, isLiked, error: null };
  } catch (error) {
    console.error("Get like status error:", error);
    return {
      totalLikes: 0,
      isLiked: false,
      error: "Failed to load like status",
    };
  }
}

export async function getBatchLikeStatus(projectIds: string[]) {
  const supabase = await createClient();

  try {
    if (!projectIds || projectIds.length === 0) {
      console.log("[v0] getBatchLikeStatus: No project IDs provided");
      return {
        likesData: {} as Record<string, { totalLikes: number; isLiked: boolean }>,
        error: null,
      };
    }

    // Convert integers to strings properly
    const cleanProjectIds = projectIds
      .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
      .map((id) => String(id).trim());

    if (cleanProjectIds.length === 0) {
      console.log("[v0] getBatchLikeStatus: No valid project IDs after cleaning");
      return {
        likesData: {} as Record<string, { totalLikes: number; isLiked: boolean }>,
        error: "No valid project IDs provided",
      };
    }

    console.log("[v0] getBatchLikeStatus: Fetching likes for projects:", cleanProjectIds);

    // Use getUser() for secure server-side auth validation
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("[v0] getBatchLikeStatus: User error:", toLoggableError(userError));
      // Continue without user - we can still get total likes
    }

    console.log("[v0] getBatchLikeStatus: User status:", user ? "logged in" : "anonymous");

    // Get all likes for these projects in one query
    const { data: allLikes, error: likesError } = await supabase
      .from("likes")
      .select("project_id, user_id")
      .in("project_id", cleanProjectIds);

    if (likesError) {
      console.error("[v0] getBatchLikeStatus: Likes fetch error:", toLoggableError(likesError));
      // Return empty data instead of error to not break UI
      const emptyLikesData: Record<string, { totalLikes: number; isLiked: boolean }> = {};
      cleanProjectIds.forEach((projectId) => {
        emptyLikesData[projectId] = { totalLikes: 0, isLiked: false };
      });
      return { likesData: emptyLikesData, error: null };
    }

    console.log("[v0] getBatchLikeStatus: Raw likes data:", allLikes?.length || 0, "likes found");

    const likesByProject = new Map<string, { count: number; userLiked: boolean }>();

    cleanProjectIds.forEach((projectId) => {
      likesByProject.set(projectId, { count: 0, userLiked: false });
    });

    if (allLikes) {
      for (const like of allLikes) {
        const likeProjectId = String(like.project_id);
        const entry = likesByProject.get(likeProjectId);
        if (entry) {
          entry.count++;
          if (user && like.user_id === user.id) {
            entry.userLiked = true;
          }
        }
      }
    }

    const likesData: Record<string, { totalLikes: number; isLiked: boolean }> = {};
    for (const [projectId, data] of likesByProject) {
      likesData[projectId] = { totalLikes: data.count, isLiked: data.userLiked };
    }

    console.log("[v0] getBatchLikeStatus: Processed likes data:", likesData);
    return { likesData, error: null };
  } catch (error) {
    console.error("[v0] getBatchLikeStatus: Unexpected error:", toLoggableError(error));
    // Return safe fallback data to prevent UI breaks
    const fallbackLikesData: Record<string, { totalLikes: number; isLiked: boolean }> = {};
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach((id) => {
        const projectIdStr = id.toString();
        if (projectIdStr && projectIdStr.trim() !== "") {
          fallbackLikesData[projectIdStr] = { totalLikes: 0, isLiked: false };
        }
      });
    }
    return { likesData: fallbackLikesData, error: null };
  }
}

export async function editProject(projectSlug: string, formData: FormData) {
  if (!projectSlug || typeof projectSlug !== "string" || projectSlug.trim() === "") {
    return { success: false, error: "Project slug is required" };
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim());
  if (!projectId) {
    return { success: false, error: "Project not found" };
  }

  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to edit projects" };
  }

  try {
    // First check if user owns this project
    const { data: project, error: checkError } = await supabase
      .from("projects")
      .select("author_id")
      .eq("id", projectId) // Use UUID directly, no parseInt
      .single();

    if (checkError) {
      return { success: false, error: "Project not found" };
    }

    if (project.author_id !== user.id) {
      return { success: false, error: "You can only edit your own projects" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const websiteUrl = formData.get("website_url") as string;
    const imageUrlsString = formData.get("image_urls") as string;
    const imageKeysString = formData.get("image_keys") as string;
    const tagline = formData.get("tagline") as string;
    const tagsString = formData.get("tags") as string;
    const trimmedWebsiteUrl = websiteUrl?.trim() || "";
    const normalizedWebsiteUrl = trimmedWebsiteUrl
      ? normalizeProjectWebsiteUrl(trimmedWebsiteUrl)
      : null;

    let imageUrls: string[] = [];
    let imageKeys: string[] = [];
    try {
      if (imageUrlsString) {
        imageUrls = JSON.parse(imageUrlsString);
      }
      if (imageKeysString) {
        imageKeys = JSON.parse(imageKeysString);
      }
    } catch (e) {
      console.warn("Failed to parse image arrays", e);
    }

    if (trimmedWebsiteUrl && !normalizedWebsiteUrl) {
      return { success: false, error: "Enter a valid website URL" };
    }

    // Parse tags from JSON string to array
    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (e) {
        console.warn("Failed to parse tags, using empty array", e);
      }
    }

    // Auto-fetch favicon if website URL changed
    let faviconUrl: string | undefined;
    if (normalizedWebsiteUrl) {
      try {
        faviconUrl = await fetchFavicon(normalizedWebsiteUrl);
      } catch (e) {
        console.warn("Failed to fetch favicon, keeping existing", e);
      }
    }

    if (!title || !description || !category) {
      return {
        success: false,
        error: "Title, description, and category are required",
      };
    }

    // Note: Don't auto-update slug when title changes (slug stays stable for SEO)
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        website_url: normalizedWebsiteUrl,
        image_urls: imageUrls,
        image_keys: imageKeys,
        tagline: tagline?.trim() || null,
        ...(faviconUrl && { favicon_url: faviconUrl }),
        tags: tags,
        updated_at: new Date().toISOString(),
        // Slug remains unchanged for stability
      })
      .eq("id", projectId); // Use UUID directly, no parseInt

    if (updateError) {
      console.error("Edit project error:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/project/${projectSlug}`);
    revalidatePath("/project/list");

    return { success: true, slug: projectSlug };
  } catch (error) {
    console.error("Edit project error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function fetchProjectsWithSorting(
  sortBy: "trending" | "top" | "newest" = "newest",
  category?: string,
  limit: number = 20,
) {
  const supabase = await createClient();

  try {
    // Resolve the incoming filter value (a category `name` slug from the UI)
    // to every representation it may be stored as on `projects.category`.
    // Older / seeded projects store the display text (e.g. "Landing Page")
    // while newer projects store the category `name` slug (e.g. "landing-page"),
    // so an exact equality match would miss one of the two.
    const categories = await getCategories();

    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.display_name);
    }

    let query = supabase.from("projects").select(`
        *,
        users!author_id (
          username,
          display_name,
          avatar_url,
          role
        )
      `);

    if (category && category !== "all") {
      const matchedCategory = categories.find(
        (cat) => cat.name === category || cat.display_name === category,
      );
      const candidateValues = Array.from(
        new Set(
          [category, matchedCategory?.name, matchedCategory?.display_name].filter(
            (value): value is string => Boolean(value),
          ),
        ),
      );

      query =
        candidateValues.length > 1
          ? query.in("category", candidateValues)
          : query.eq("category", category);
    }

    // For like-based sorts ('top'/'trending') the ranking key (likes) is
    // computed separately and cannot be ordered in SQL, so a tight `limit`
    // here would truncate the newest-N window and hide older high-like
    // projects. Fetch a wider candidate window first, then sort + truncate
    // to `limit` in JS below. 'newest' can be ordered + limited directly.
    const CANDIDATE_MULTIPLIER = 5;
    const MAX_CANDIDATES = 200;
    const fetchLimit =
      sortBy === "newest"
        ? limit
        : Math.min(MAX_CANDIDATES, Math.max(limit, limit * CANDIDATE_MULTIPLIER));

    query = query.order("created_at", { ascending: false }).limit(fetchLimit);

    const { data: projectsWithUsers, error } = await query;

    if (error) {
      console.error("[fetchProjectsWithSorting] Error fetching projects:", toLoggableError(error));
      return { projects: [], error: error.message };
    }

    if (!projectsWithUsers || projectsWithUsers.length === 0) {
      return { projects: [], error: null };
    }

    const projectIds = projectsWithUsers.map((p) => p.id);
    const likesResult = await getBatchLikeStatus(projectIds);

    const likesData = likesResult.likesData || {};

    const formattedProjects = projectsWithUsers.map((project) => {
      const projectLikesData = likesData[String(project.id)] || { totalLikes: 0, isLiked: false };
      const categoryDisplayName = categoryMap.get(project.category) || project.category;

      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        description: project.description,
        image: getPrimaryProjectImage(project),
        author: {
          name: project.users?.display_name || "Unknown",
          username: project.users?.username || "unknown",
          role: project.users?.role ?? null,
          avatar: project.users?.avatar_url || "/vibedev-guest-avatar.png",
        },
        url: project.website_url || undefined,
        category: categoryDisplayName,
        likes: projectLikesData.totalLikes,
        views: 0,
        createdAt: project.created_at,
      };
    });

    const sortedProjects = [...formattedProjects];

    if (sortBy === "newest") {
      // Already ordered by created_at desc from the query; keep as-is.
      sortedProjects.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "top") {
      // All-time best: rank purely by total likes, newest as tiebreaker.
      sortedProjects.sort((a, b) => {
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Trending: likes weighted by recency so newer popular projects rank
      // higher than equally-liked but older ones.
      const trendingScore = (likes: number, createdAt: string) => {
        const ageInDays = Math.max(1, (Date.now() - new Date(createdAt).getTime()) / 86400000);
        return likes / ageInDays;
      };

      sortedProjects.sort((a, b) => {
        const scoreDiff = trendingScore(b.likes, b.createdAt) - trendingScore(a.likes, a.createdAt);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    // Truncate to the requested limit after sorting so like-based ranks are
    // computed across the full candidate window rather than a newest-N slice.
    const limitedProjects = sortedProjects.slice(0, limit);

    console.log(
      `[fetchProjectsWithSorting] Fetched ${limitedProjects.length} projects with sorting: ${sortBy}, category: ${category || "all"}`,
    );

    return { projects: limitedProjects, error: null };
  } catch (error) {
    console.error("[fetchProjectsWithSorting] Unexpected error:", toLoggableError(error));
    return { projects: [], error: "Failed to fetch projects" };
  }
}

export async function deleteProject(projectSlug: string) {
  if (!projectSlug || typeof projectSlug !== "string" || projectSlug.trim() === "") {
    return { success: false, error: "Project slug is required" };
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim());
  if (!projectId) {
    return { success: false, error: "Project not found" };
  }

  const supabase = await createClient();
  // Use getUser() for secure server-side auth validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to delete projects" };
  }

  try {
    // First check if user owns this project
    const { data: project, error: checkError } = await supabase
      .from("projects")
      .select("author_id")
      .eq("id", projectId) // Use UUID directly, no parseInt
      .single();

    if (checkError) {
      return { success: false, error: "Project not found" };
    }

    if (project.author_id !== user.id) {
      return { success: false, error: "You can only delete your own projects" };
    }

    const { data: projectWithImages } = await supabase
      .from("projects")
      .select("image_keys")
      .eq("id", projectId)
      .single();

    await Promise.all([
      supabase.from("comments").delete().eq("project_id", projectId),
      supabase.from("likes").delete().eq("project_id", projectId),
      supabase.from("views").delete().eq("project_id", projectId),
    ]);

    const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);

    if (deleteError) {
      console.error("Delete project error:", deleteError);
      return { success: false, error: deleteError.message };
    }

    if (projectWithImages?.image_keys?.length) {
      try {
        const { deleteUploadthingFiles } = await import("./uploadthing");
        await deleteUploadthingFiles(projectWithImages.image_keys);
      } catch {
        console.warn("Failed to cleanup uploaded images for deleted project:", projectSlug);
      }
    }

    revalidatePath("/project/list");
    revalidatePath(`/project/${projectSlug}`);

    console.log("[Delete Project] Successfully deleted project with slug:", projectSlug);
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
