import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNotNull,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { getCategories, getCategoryDisplayName } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { toProjectDto } from "@/lib/db/mappers";
import { likes, projects, users, views } from "@/lib/db/schema";
import {
  decodeProjectCursor,
  encodeProjectCursor,
  PROJECT_PAGE_SIZE,
  trendingScore,
  type ProjectPageCursor,
} from "@/lib/project-page-cursor";
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
      .select({ value: countDistinct(views.sessionId) })
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
    image: getPrimaryProjectImage(mapped),
    imageUrls: mapped.imageUrls?.length
      ? mapped.imageUrls
      : mapped.imageUrl
        ? [mapped.imageUrl]
        : [],
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

/**
 * Screenshot keys for the signed-in owner only. Public detail reads do not
 * include keys, because a key is enough to ask UploadThing to delete the file.
 */
export async function getOwnedProjectImageKeys(slug: string, userId: string): Promise<string[]> {
  if (!slug.trim() || !userId) return [];

  const db = getDb();
  const [row] = await db
    .select({ authorId: projects.authorId, imageKeys: projects.imageKeys })
    .from(projects)
    .where(eq(projects.slug, slug.trim()))
    .limit(1);

  if (!row || row.authorId !== userId) return [];
  return row.imageKeys ?? [];
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

  try {
    const likeRows = await db
      .select({
        projectId: likes.projectId,
        totalLikes: count(),
        isLiked: userId ? sql<boolean>`bool_or(${likes.userId} = ${userId})` : sql<boolean>`false`,
      })
      .from(likes)
      .where(inArray(likes.projectId, projectIds))
      .groupBy(likes.projectId);

    for (const row of likeRows) {
      if (row.projectId == null) continue;
      likesByProject.set(String(row.projectId), {
        totalLikes: Number(row.totalLikes) || 0,
        isLiked: Boolean(row.isLiked),
      });
    }
  } catch (likesError) {
    console.error("getBatchLikeStatus: Likes fetch error:", likesError);
    return Object.fromEntries(likesByProject);
  }

  return Object.fromEntries(likesByProject);
}

const likeCountSql = sql<number>`(select count(*)::int from ${likes} where ${likes.projectId} = ${projects.id})`;

const trendingScoreSql = sql<number>`(
  (select count(*)::int from ${likes} where ${likes.projectId} = ${projects.id})::float
  / greatest(1, extract(epoch from (now() - ${projects.createdAt})) / 86400.0)
)`;

function projectOrder(sortBy: "trending" | "top" | "newest") {
  if (sortBy === "top") {
    return [desc(likeCountSql), desc(projects.createdAt), desc(projects.id)];
  }
  if (sortBy === "trending") {
    return [desc(trendingScoreSql), desc(projects.id)];
  }
  return [desc(projects.createdAt), desc(projects.id)];
}

function projectCursorCondition(
  sortBy: "trending" | "top" | "newest",
  cursor: ProjectPageCursor,
): SQL {
  const createdAt = new Date(cursor.createdAt);
  if (sortBy === "top") {
    return or(
      sql`${likeCountSql} < ${cursor.likes}`,
      and(sql`${likeCountSql} = ${cursor.likes}`, lt(projects.createdAt, createdAt)),
      and(
        sql`${likeCountSql} = ${cursor.likes}`,
        eq(projects.createdAt, createdAt),
        lt(projects.id, cursor.id),
      ),
    ) as SQL;
  }
  if (sortBy === "trending") {
    return or(
      sql`${trendingScoreSql} < ${cursor.score}`,
      and(sql`${trendingScoreSql} = ${cursor.score}`, lt(projects.id, cursor.id)),
    ) as SQL;
  }
  return or(
    lt(projects.createdAt, createdAt),
    and(eq(projects.createdAt, createdAt), lt(projects.id, cursor.id)),
  ) as SQL;
}

export interface ProjectPage {
  projects: ProjectCard[];
  nextCursor: string | null;
}

export async function fetchProjectPage(options: {
  sortBy?: "trending" | "top" | "newest";
  category?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<ProjectPage> {
  const sortBy = options.sortBy ?? "newest";
  const limit = options.limit ?? PROJECT_PAGE_SIZE;
  const cursor = decodeProjectCursor(options.cursor);
  const categories = await getCategories();

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.name, cat.display_name);
  }

  const db = getDb();
  const category = options.category;

  let categoryCondition: SQL | undefined;
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

  const filters = [categoryCondition, cursor ? projectCursorCondition(sortBy, cursor) : undefined].filter(
    (filter): filter is SQL => Boolean(filter),
  );

  const projectRows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      description: projects.description,
      category: projects.category,
      websiteUrl: projects.websiteUrl,
      imageUrl: projects.imageUrl,
      imageUrls: projects.imageUrls,
      tags: projects.tags,
      createdAt: projects.createdAt,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
      authorRole: users.role,
    })
    .from(projects)
    .innerJoin(users, eq(projects.authorId, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(...projectOrder(sortBy))
    .limit(limit);

  if (!projectRows.length) {
    return { projects: [], nextCursor: null };
  }

  const session = await getServerSession();
  const projectIds = projectRows.map((row) => row.id);
  const likesByProjectId = await getBatchLikeStatus(projectIds, session?.user?.id);

  const formattedProjects: ProjectCard[] = projectRows.map((row) => {
    const projectLikesData = likesByProjectId[String(row.id)] ?? {
      totalLikes: 0,
      isLiked: false,
    };
    const categoryDisplayName = categoryMap.get(row.category) || row.category;
    const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : "";

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      image: getPrimaryProjectImage(row),
      author: {
        name: row.authorDisplayName || "Unknown",
        username: row.authorUsername || "unknown",
        role: row.authorRole ?? null,
        avatar: row.authorAvatarUrl || "/vibedev-guest-avatar.png",
      },
      url: row.websiteUrl || undefined,
      category: categoryDisplayName,
      likes: projectLikesData.totalLikes,
      views: 0,
      createdAt,
    };
  });

  const last = formattedProjects[formattedProjects.length - 1];
  const nextCursor =
    formattedProjects.length === limit && last
      ? encodeProjectCursor({
          id: Number(last.id),
          createdAt: last.createdAt,
          likes: last.likes,
          score: trendingScore(last.likes, last.createdAt),
        })
      : null;

  return { projects: formattedProjects, nextCursor };
}

export async function fetchProjectsWithSorting(
  sortBy: "trending" | "top" | "newest" = "newest",
  category?: string,
  limit: number = PROJECT_PAGE_SIZE,
): Promise<ProjectCard[]> {
  const page = await fetchProjectPage({ sortBy, category, limit });
  return page.projects;
}
