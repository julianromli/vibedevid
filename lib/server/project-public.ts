import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getCategories, getCategoryDisplayName } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { toProjectDto } from "@/lib/db/mappers";
import { likes, projects, users, views } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";

export interface ProjectCardAuthor {
  name: string;
  username: string;
  role: number | null;
  avatar: string;
}

export interface ProjectCard {
  id: number | string;
  slug: string;
  title: string;
  description?: string;
  image: string | null;
  author: ProjectCardAuthor;
  url?: string;
  category: string;
  likes: number;
  views: number;
  createdAt: string;
}

export interface ProjectDetail {
  id: number | string;
  slug: string;
  title: string;
  description: string;
  fullDescription: string;
  image: string | null;
  imageUrls: string[];
  imageKeys: string[];
  author: ProjectCardAuthor & { bio: string; location: string };
  url: string | null;
  category: string;
  categoryRaw: string;
  tagline: string;
  faviconUrl: string;
  tags: string[];
  likes: number;
  views: number;
  uniqueViews: number;
  todayViews: number;
  createdAt: string;
}

/**
 * Project read for public display: detail (project + like/view counts) and
 * list (filtered/sorted cards). Server-only; callers are route loaders and
 * the `.functions` server-function wrappers.
 *
 * Contract (same as the other `lib/server/*-public` modules):
 *   - absent/missing resource -> `null` / `[]`
 *   - database failure -> THROWS (routes surface 500s; they only render
 *     "not found" for a genuine absence)
 */

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  if (!slug || slug.trim() === "") {
    return null;
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
    return null;
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

  return {
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
    createdAt: mapped.createdAt ?? "",
  };
}

const getPrimaryProjectImage = (project: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string | null => {
  const firstImageUrl = Array.isArray(project.imageUrls)
    ? project.imageUrls.find((url) => typeof url === "string" && url)
    : null;

  return project.imageUrl || firstImageUrl || null;
};

/**
 * Like data for a batch of projects, keyed by stringified project id:
 * { totalLikes, isLiked }. Failure degrades to zeroed entries per project
 * rather than failing the list read. This stays a deliberate degrade: a
 * list page's like counts aren't worth failing the page over.
 */
async function getBatchLikeStatus(
  projectIds: number[],
  userId?: string,
): Promise<Record<string, { totalLikes: number; isLiked: boolean }>> {
  if (projectIds.length === 0) {
    return {};
  }

  const likesByProject = new Map<string, { totalLikes: number; isLiked: boolean }>();
  for (const projectId of projectIds) {
    likesByProject.set(String(projectId), { totalLikes: 0, isLiked: false });
  }

  const db = getDb();

  let allLikes: { projectId: number | null; userId: string | null }[];
  try {
    allLikes = await db
      .select({ projectId: likes.projectId, userId: likes.userId })
      .from(likes)
      .where(inArray(likes.projectId, projectIds));
  } catch (likesError) {
    console.error("getBatchLikeStatus: Likes fetch error:", likesError);
    return Object.fromEntries(likesByProject);
  }

  for (const like of allLikes) {
    if (like.projectId == null) continue;
    const entry = likesByProject.get(String(like.projectId));
    if (entry) {
      entry.totalLikes++;
      if (userId && like.userId === userId) {
        entry.isLiked = true;
      }
    }
  }

  return Object.fromEntries(likesByProject);
}

export async function fetchProjectsWithSorting(
  sortBy: "trending" | "top" | "newest" = "newest",
  category?: string,
  limit: number = 20,
): Promise<ProjectCard[]> {
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

  let categoryCondition;
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
    return [];
  }

  const session = await getServerSession();
  const projectIds = projectRows.map((p) => p.project.id);
  const likesByProjectId = await getBatchLikeStatus(projectIds, session?.user?.id);

  const formattedProjects: ProjectCard[] = projectRows.map((row) => {
    const mapped = toProjectDto(row.project);
    const projectLikesData = likesByProjectId[String(mapped.id)] ?? {
      totalLikes: 0,
      isLiked: false,
    };
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

  if (sortBy === "newest") {
    formattedProjects.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (sortBy === "top") {
    formattedProjects.sort((a, b) => {
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

    formattedProjects.sort((a, b) => {
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

  return formattedProjects.slice(0, limit);
}
