import { getCategories, getCategoryDisplayName } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { toProjectDto } from "@/lib/db/mappers";
import { projects, users, likes, views } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";

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

/**
 * Project read for public display: detail (project + like/view counts) and
 * list (filtered/sorted cards). Server-only; callers are route loaders and
 * the `.functions` server-function wrappers.
 */
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

/**
 * Like data for a batch of projects, keyed by stringified project id:
 * { totalLikes, isLiked }. Failure degrades to zeroed entries per project
 * rather than failing the list read.
 */
async function getBatchLikeStatus(projectIds: string[]) {
  try {
    if (!projectIds || projectIds.length === 0) {
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
      return {
        likesData: {} as Record<string, { totalLikes: number; isLiked: boolean }>,
        error: "No valid project IDs provided",
      };
    }

    const session = await getServerSession();
    const userId = session?.user?.id;

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

    return { projects: limitedProjects, error: null };
  } catch (error) {
    console.error("[fetchProjectsWithSorting] Unexpected error:", toLoggableError(error));
    return { projects: [], error: "Failed to fetch projects" };
  }
}
