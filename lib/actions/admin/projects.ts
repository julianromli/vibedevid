import { revalidatePath } from "@/lib/revalidation";
import { normalizeProjectWebsiteUrl } from "../../project-url";
import { getDb } from "@/lib/db";
import { projects, users, likes, views, comments, categories } from "@/lib/db/schema";
import { toProjectDto } from "@/lib/db/mappers";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { eq, and, gte, lte, desc, count, or, ilike, inArray, asc } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export interface AdminProject {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  website_url: string | null;
  image_url: string | null;
  tagline: string | null;
  tags: string[];
  featured: boolean;
  author_id: string;
  author: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  created_at: string;
  updated_at: string;
  likes_count: number;
  views_count: number;
  comments_count: number;
}

export interface GetAllProjectsResult {
  projects: AdminProject[];
  totalCount: number;
  error?: string;
}

export interface ProjectFilters {
  status?: "all" | "featured" | "regular";
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

function sanitizeSearchInput(search: string): string {
  return search.replace(/[%_]/g, "\\$&");
}

export async function getAllProjects(
  filters: ProjectFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllProjectsResult> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const conditions = [];

    if (filters.status === "featured") {
      conditions.push(eq(projects.featured, true));
    } else if (filters.status === "regular") {
      conditions.push(eq(projects.featured, false));
    }

    if (filters.category && filters.category !== "all") {
      conditions.push(eq(projects.category, filters.category));
    }

    if (filters.dateFrom) {
      conditions.push(gte(projects.createdAt, new Date(filters.dateFrom)));
    }

    if (filters.dateTo) {
      conditions.push(lte(projects.createdAt, new Date(filters.dateTo)));
    }

    if (filters.search) {
      const sanitized = sanitizeSearchInput(filters.search);
      const pattern = `%${sanitized}%`;
      conditions.push(or(ilike(projects.title, pattern), ilike(projects.description, pattern)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [totalResult, projectRows] = await Promise.all([
      db.select({ value: count() }).from(projects).where(whereClause),
      db
        .select({
          project: projects,
          authorUsername: users.username,
          authorDisplayName: users.displayName,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(projects)
        .innerJoin(users, eq(projects.authorId, users.id))
        .where(whereClause)
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const projectIds = projectRows.map((row) => row.project.id);

    const [likeRows, viewRows, commentRows] = await Promise.all([
      projectIds.length > 0
        ? db
            .select({ projectId: likes.projectId })
            .from(likes)
            .where(inArray(likes.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select({ projectId: views.projectId })
            .from(views)
            .where(inArray(views.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select({ projectId: comments.projectId })
            .from(comments)
            .where(inArray(comments.projectId, projectIds))
        : Promise.resolve([]),
    ]);

    const likesCount: Record<number, number> = {};
    const viewsCount: Record<number, number> = {};
    const commentsCount: Record<number, number> = {};

    likeRows.forEach((like) => {
      if (like.projectId) {
        likesCount[like.projectId] = (likesCount[like.projectId] || 0) + 1;
      }
    });

    viewRows.forEach((view) => {
      if (view.projectId) {
        viewsCount[view.projectId] = (viewsCount[view.projectId] || 0) + 1;
      }
    });

    commentRows.forEach((comment) => {
      if (comment.projectId) {
        commentsCount[comment.projectId] = (commentsCount[comment.projectId] || 0) + 1;
      }
    });

    const formattedProjects: AdminProject[] = projectRows.map((row) => {
      const mapped = toProjectDto(row.project);
      return {
        id: mapped.id,
        slug: mapped.slug,
        title: mapped.title,
        description: mapped.description,
        category: mapped.category,
        website_url: mapped.websiteUrl,
        image_url: mapped.imageUrl,
        tagline: mapped.tagline,
        tags: mapped.tags || [],
        featured: mapped.featured || false,
        author_id: mapped.authorId,
        author: {
          username: row.authorUsername || "unknown",
          display_name: row.authorDisplayName || "Unknown",
          avatar_url: row.authorAvatarUrl,
        },
        created_at: mapped.createdAt ?? "",
        updated_at: mapped.updatedAt ?? "",
        likes_count: likesCount[mapped.id] || 0,
        views_count: viewsCount[mapped.id] || 0,
        comments_count: commentsCount[mapped.id] || 0,
      };
    });

    return {
      projects: formattedProjects,
      totalCount: totalResult[0]?.value || 0,
    };
  } catch (error) {
    console.error("Get all projects error:", error);
    return {
      projects: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to load projects",
    };
  }
}

export async function adminUpdateProject(
  projectId: number,
  updates: Partial<AdminProject>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const normalizedWebsiteUrl =
      updates.website_url === undefined
        ? undefined
        : updates.website_url === null
          ? null
          : updates.website_url.trim().length === 0
            ? null
            : normalizeProjectWebsiteUrl(updates.website_url);

    if (
      updates.website_url !== undefined &&
      updates.website_url !== null &&
      updates.website_url.trim().length > 0 &&
      !normalizedWebsiteUrl
    ) {
      return { success: false, error: "Enter a valid website URL" };
    }

    const db = getDb();
    const updatedRows = await db
      .update(projects)
      .set({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.website_url !== undefined && { websiteUrl: normalizedWebsiteUrl }),
        ...(updates.image_url !== undefined && { imageUrl: updates.image_url }),
        ...(updates.tagline !== undefined && { tagline: updates.tagline }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.featured !== undefined && { featured: updates.featured }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (!updatedRows.length) {
      return {
        success: false,
        error: "Project not found or no changes applied",
      };
    }

    revalidatePath("/project/[slug]");
    revalidatePath("/admin/dashboard/boards/projects");

    return { success: true };
  } catch (error) {
    console.error("Admin update project error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

export async function adminDeleteProject(
  projectId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();

    await Promise.all([
      db.delete(comments).where(eq(comments.projectId, projectId)),
      db.delete(likes).where(eq(likes.projectId, projectId)),
      db.delete(views).where(eq(views.projectId, projectId)),
    ]);

    const deletedRows = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (!deletedRows.length) {
      return { success: false, error: "Project could not be deleted" };
    }

    revalidatePath("/project/list");
    revalidatePath("/admin/dashboard/boards/projects");

    return { success: true };
  } catch (error) {
    console.error("Admin delete project error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}

export async function toggleProjectFeatured(
  projectId: number,
  featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const updatedRows = await db
      .update(projects)
      .set({ featured, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning({ id: projects.id });

    if (!updatedRows.length) {
      return { success: false, error: "Project not found" };
    }

    revalidatePath("/");
    revalidatePath("/admin/dashboard/boards/projects");

    return { success: true };
  } catch (error) {
    console.error("Toggle project featured error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle featured status",
    };
  }
}

export async function getProjectCategories(): Promise<{
  categories: string[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const data = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));

    return { categories: data.map((c) => c.name) };
  } catch (error) {
    return {
      categories: [],
      error: error instanceof Error ? error.message : "Failed to load categories",
    };
  }
}
