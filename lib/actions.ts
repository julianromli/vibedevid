import { revalidatePath } from "@/lib/revalidation";
import { getCategories, getCategoryDisplayName } from "./categories";
import { fetchFavicon } from "./favicon-utils";
import { normalizeProjectWebsiteUrl } from "./project-url";
import { getProjectIdBySlug } from "./slug";
import { getDb } from "@/lib/db";
import { projects, users, likes, views, comments } from "@/lib/db/schema";
import { toProjectDto } from "@/lib/db/mappers";
import { getServerSession, requireUser } from "@/lib/server/auth";
import { eq, and, desc, count, inArray, isNotNull } from "drizzle-orm";

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

export async function getProjectBySlug(slug: string) {
  try {
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return { project: null, error: "Project slug is required" };
    }

    const db = getDb();
    const [row] = await db
      .select({
        project: projects,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        authorRole: users.role,
        authorBio: users.bio,
        authorLocation: users.location,
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .where(eq(projects.slug, slug.trim()))
      .limit(1);

    if (!row) {
      return { project: null, error: "Project not found" };
    }

    const mapped = toProjectDto(row.project);
    const projectPk = mapped.id;
    const today = new Date().toISOString().split("T")[0];

    const [likesResult, totalViewsResult, uniqueViewsResult, todayViewsResult] = await Promise.all([
      db.select({ value: count() }).from(likes).where(eq(likes.projectId, projectPk)),
      db.select({ value: count() }).from(views).where(eq(views.projectId, projectPk)),
      db
        .select({ value: count() })
        .from(views)
        .where(and(eq(views.projectId, projectPk), isNotNull(views.sessionId))),
      db
        .select({ value: count() })
        .from(views)
        .where(and(eq(views.projectId, projectPk), eq(views.viewDate, today))),
    ]);

    const categoryDisplayName = await getCategoryDisplayName(mapped.category);

    const formattedProject = {
      id: mapped.id,
      slug: mapped.slug,
      title: mapped.title,
      description: mapped.description ?? "",
      fullDescription: mapped.description ?? "",
      image: mapped.imageUrl,
      imageUrls: mapped.imageUrls || (mapped.imageUrl ? [mapped.imageUrl] : []),
      imageKeys: mapped.imageKeys || [],
      author: {
        name: row.authorDisplayName,
        username: row.authorUsername,
        role: row.authorRole ?? null,
        avatar: row.authorAvatarUrl || "/placeholder.svg",
        bio: row.authorBio || "Community member",
        location: row.authorLocation || "Unknown location",
      },
      url: mapped.websiteUrl,
      category: categoryDisplayName,
      categoryRaw: mapped.category,
      tagline: mapped.tagline || "",
      faviconUrl: mapped.faviconUrl || "/default-favicon.svg",
      tags: mapped.tags || [],
      likes: likesResult[0]?.value || 0,
      views: totalViewsResult[0]?.value || 0,
      uniqueViews: uniqueViewsResult[0]?.value || 0,
      todayViews: todayViewsResult[0]?.value || 0,
      createdAt: mapped.createdAt,
    };

    return { project: formattedProject, error: null };
  } catch (error) {
    console.error("Get project by slug error:", error);
    return { project: null, error: "Failed to load project" };
  }
}

const getPrimaryProjectImage = (project: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string | null => {
  const firstImageUrl = Array.isArray(project.imageUrls)
    ? project.imageUrls.find((url) => typeof url === "string" && url)
    : null;
  return firstImageUrl || project.imageUrl || null;
};

export async function getProject(projectId: string) {
  console.warn("[DEPRECATED] getProject() is deprecated. Use getProjectBySlug() instead.");

  const db = getDb();

  try {
    const numericId = Number(projectId);
    if (!Number.isInteger(numericId)) {
      return { project: null, error: "Project not found" };
    }

    const [data] = await db
      .select({ slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, numericId))
      .limit(1);

    if (!data?.slug) {
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

  const projectIdStr = await getProjectIdBySlug(projectSlug.trim());
  if (!projectIdStr) {
    console.error("[Server] incrementProjectViews: Project not found for slug:", projectSlug);
    return;
  }

  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    console.error("[Server] incrementProjectViews: Invalid project ID for slug:", projectSlug);
    return;
  }

  const session = await getServerSession();
  const db = getDb();
  const viewDate = new Date().toISOString().split("T")[0];

  try {
    console.log(
      "[Server] Incrementing view for project slug:",
      projectSlug,
      "ID:",
      projectId,
      "Session:",
      sessionId,
    );

    await db.insert(views).values({
      projectId,
      userId: session?.user?.id || null,
      sessionId: sessionId || null,
      ipAddress: null,
      viewDate,
    });

    console.log("[Server] View tracked successfully");
  } catch (error) {
    const pgError = error as { code?: string; message?: string };
    if (
      pgError.code === "23505" ||
      pgError.message?.includes("duplicate") ||
      pgError.message?.includes("unique")
    ) {
      console.log("[Server] View already tracked for this session");
    } else {
      console.error("[Server] Increment views error:", error);
    }
  }
}

export async function incrementBlogPostViews(postId: string, sessionId?: string) {
  if (!postId || typeof postId !== "string" || postId.trim() === "") {
    console.error("[Server] incrementBlogPostViews: postId is required");
    return;
  }

  const session = await getServerSession();
  const db = getDb();
  const viewDate = new Date().toISOString().split("T")[0];

  try {
    console.log("[Server] Incrementing view for blog post:", postId, "Session:", sessionId);

    await db.insert(views).values({
      postId: postId.trim(),
      userId: session?.user?.id || null,
      sessionId: sessionId || null,
      ipAddress: null,
      viewDate,
    });

    console.log("[Server] Blog view tracked successfully");
  } catch (error) {
    const pgError = error as { code?: string; message?: string };
    if (
      pgError.code === "23505" ||
      pgError.message?.includes("duplicate") ||
      pgError.message?.includes("unique")
    ) {
      console.log("[Server] Blog view already tracked for this session");
    } else {
      console.error("[Server] Increment blog views error:", error);
    }
  }
}

export async function toggleLike(projectId: string) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "You must be logged in to like projects" };
  }

  if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
    return { error: "Project ID is required" };
  }

  const numericProjectId = Number(projectId.trim());
  if (!Number.isInteger(numericProjectId)) {
    return { error: "Invalid project ID" };
  }

  const db = getDb();

  try {
    const [existingLike] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.projectId, numericProjectId), eq(likes.userId, user.id)))
      .limit(1);

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id));
      return { success: true, isLiked: false };
    }

    await db.insert(likes).values({
      projectId: numericProjectId,
      userId: user.id,
    });

    return { success: true, isLiked: true };
  } catch (error) {
    console.error("Toggle like error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function getLikeStatus(projectId: string) {
  const session = await getServerSession();

  try {
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      console.error("Get like status error: projectId is required");
      return { totalLikes: 0, isLiked: false, error: "Project ID is required" };
    }

    const numericProjectId = Number(projectId.trim());
    if (!Number.isInteger(numericProjectId)) {
      return { totalLikes: 0, isLiked: false, error: "Invalid project ID" };
    }

    const db = getDb();

    const [likesResult] = await db
      .select({ value: count() })
      .from(likes)
      .where(eq(likes.projectId, numericProjectId));

    let isLiked = false;
    if (session?.user) {
      const [userLike] = await db
        .select({ id: likes.id })
        .from(likes)
        .where(and(eq(likes.projectId, numericProjectId), eq(likes.userId, session.user.id)))
        .limit(1);

      isLiked = Boolean(userLike);
    }

    return { totalLikes: likesResult?.value || 0, isLiked, error: null };
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
  try {
    if (!projectIds || projectIds.length === 0) {
      console.log("[v0] getBatchLikeStatus: No project IDs provided");
      return {
        likesData: {} as Record<string, { totalLikes: number; isLiked: boolean }>,
        error: null,
      };
    }

    const cleanProjectIds = projectIds
      .filter((id) => id !== null && id !== undefined && String(id).trim() !== "")
      .map((id) => Number(String(id).trim()))
      .filter((id) => Number.isInteger(id));

    if (cleanProjectIds.length === 0) {
      console.log("[v0] getBatchLikeStatus: No valid project IDs after cleaning");
      return {
        likesData: {} as Record<string, { totalLikes: number; isLiked: boolean }>,
        error: "No valid project IDs provided",
      };
    }

    console.log("[v0] getBatchLikeStatus: Fetching likes for projects:", cleanProjectIds);

    const session = await getServerSession();
    const userId = session?.user?.id;

    console.log("[v0] getBatchLikeStatus: User status:", userId ? "logged in" : "anonymous");

    const db = getDb();

    let allLikes: { projectId: number | null; userId: string | null }[] = [];
    try {
      allLikes = await db
        .select({ projectId: likes.projectId, userId: likes.userId })
        .from(likes)
        .where(inArray(likes.projectId, cleanProjectIds));
    } catch (likesError) {
      console.error("[v0] getBatchLikeStatus: Likes fetch error:", toLoggableError(likesError));
      const emptyLikesData: Record<string, { totalLikes: number; isLiked: boolean }> = {};
      cleanProjectIds.forEach((projectId) => {
        emptyLikesData[String(projectId)] = { totalLikes: 0, isLiked: false };
      });
      return { likesData: emptyLikesData, error: null };
    }

    console.log("[v0] getBatchLikeStatus: Raw likes data:", allLikes.length, "likes found");

    const likesByProject = new Map<string, { count: number; userLiked: boolean }>();

    cleanProjectIds.forEach((projectId) => {
      likesByProject.set(String(projectId), { count: 0, userLiked: false });
    });

    for (const like of allLikes) {
      if (!like.projectId) continue;
      const likeProjectId = String(like.projectId);
      const entry = likesByProject.get(likeProjectId);
      if (entry) {
        entry.count++;
        if (userId && like.userId === userId) {
          entry.userLiked = true;
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

  const projectIdStr = await getProjectIdBySlug(projectSlug.trim());
  if (!projectIdStr) {
    return { success: false, error: "Project not found" };
  }

  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    return { success: false, error: "Project not found" };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in to edit projects" };
  }

  const db = getDb();

  try {
    const [project] = await db
      .select({ authorId: projects.authorId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.authorId !== user.id) {
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

    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (e) {
        console.warn("Failed to parse tags, using empty array", e);
      }
    }

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

    await db
      .update(projects)
      .set({
        title: title.trim(),
        description: description.trim(),
        category,
        websiteUrl: normalizedWebsiteUrl,
        imageUrls,
        imageKeys,
        tagline: tagline?.trim() || null,
        ...(faviconUrl && { faviconUrl }),
        tags,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

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
  try {
    const categories = await getCategories();

    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.display_name);
    }

    const db = getDb();
    const CANDIDATE_MULTIPLIER = 5;
    const MAX_CANDIDATES = 200;
    const fetchLimit =
      sortBy === "newest"
        ? limit
        : Math.min(MAX_CANDIDATES, Math.max(limit, limit * CANDIDATE_MULTIPLIER));

    let categoryCondition = undefined;
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

      categoryCondition =
        candidateValues.length > 1
          ? inArray(projects.category, candidateValues)
          : eq(projects.category, category);
    }

    const projectRows = await db
      .select({
        project: projects,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        authorRole: users.role,
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .where(categoryCondition)
      .orderBy(desc(projects.createdAt))
      .limit(fetchLimit);

    if (!projectRows.length) {
      return { projects: [], error: null };
    }

    const projectIds = projectRows.map((p) => String(p.project.id));
    const likesResult = await getBatchLikeStatus(projectIds);
    const likesData = likesResult.likesData || {};

    const formattedProjects = projectRows.map((row) => {
      const mapped = toProjectDto(row.project);
      const projectLikesData = likesData[String(mapped.id)] || { totalLikes: 0, isLiked: false };
      const categoryDisplayName = categoryMap.get(mapped.category) || mapped.category;

      return {
        id: mapped.id,
        slug: mapped.slug,
        title: mapped.title,
        description: mapped.description ?? undefined,
        image: getPrimaryProjectImage(mapped),
        author: {
          name: row.authorDisplayName || "Unknown",
          username: row.authorUsername || "unknown",
          role: row.authorRole ?? null,
          avatar: row.authorAvatarUrl || "/vibedev-guest-avatar.png",
        },
        url: mapped.websiteUrl || undefined,
        category: categoryDisplayName,
        likes: projectLikesData.totalLikes,
        views: 0,
        createdAt: mapped.createdAt ?? "",
      };
    });

    const sortedProjects = [...formattedProjects];

    if (sortBy === "newest") {
      sortedProjects.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "top") {
      sortedProjects.sort((a, b) => {
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
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

  const projectIdStr = await getProjectIdBySlug(projectSlug.trim());
  if (!projectIdStr) {
    return { success: false, error: "Project not found" };
  }

  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    return { success: false, error: "Project not found" };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in to delete projects" };
  }

  const db = getDb();

  try {
    const [project] = await db
      .select({ authorId: projects.authorId, imageKeys: projects.imageKeys })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.authorId !== user.id) {
      return { success: false, error: "You can only delete your own projects" };
    }

    await Promise.all([
      db.delete(comments).where(eq(comments.projectId, projectId)),
      db.delete(likes).where(eq(likes.projectId, projectId)),
      db.delete(views).where(eq(views.projectId, projectId)),
    ]);

    await db.delete(projects).where(eq(projects.id, projectId));

    if (project.imageKeys?.length) {
      try {
        const { deleteUploadthingFiles } = await import("./uploadthing");
        await deleteUploadthingFiles(project.imageKeys);
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
