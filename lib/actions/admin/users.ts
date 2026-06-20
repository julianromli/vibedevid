import { revalidatePath } from "@/lib/revalidation";
import { getDb } from "@/lib/db";
import { users, projects, posts, comments, likes, authUser } from "@/lib/db/schema";
import { toUserProfile } from "@/lib/db/mappers";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { ROLES } from "./schemas";
import { eq, and, or, ilike, desc, count, inArray, isNull } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  github_url: string | null;
  twitter_url: string | null;
  role: number;
  joined_at: string;
  updated_at: string;
  is_suspended: boolean;
  stats: {
    projects_count: number;
    posts_count: number;
    comments_count: number;
    likes_received: number;
  };
}

export interface GetAllUsersResult {
  users: AdminUser[];
  totalCount: number;
  error?: string;
}

export interface UserFilters {
  search?: string;
  role?: "all" | "admin" | "moderator" | "user";
  status?: "all" | "active" | "suspended";
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

function sanitizeSearchInput(search: string): string {
  return search.replace(/[%_]/g, "\\$&");
}

export async function getAllUsers(
  filters: UserFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllUsersResult> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const conditions = [];

    if (filters.role && filters.role !== "all") {
      const roleMap: Record<string, number> = {
        admin: ROLES.ADMIN,
        moderator: ROLES.MODERATOR,
        user: ROLES.USER,
      };
      conditions.push(eq(users.role, roleMap[filters.role]));
    }

    if (filters.status === "suspended") {
      conditions.push(eq(users.isSuspended, true));
    } else if (filters.status === "active") {
      conditions.push(or(eq(users.isSuspended, false), isNull(users.isSuspended)));
    }

    if (filters.search) {
      const sanitized = sanitizeSearchInput(filters.search);
      const pattern = `%${sanitized}%`;
      conditions.push(or(ilike(users.username, pattern), ilike(users.displayName, pattern)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [totalResult, userRows] = await Promise.all([
      db.select({ value: count() }).from(users).where(whereClause),
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.joinedAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const userIds = userRows.map((u) => u.id);

    const [projectRows, postRows, commentRows, likeRows, authRows] = await Promise.all([
      userIds.length > 0
        ? db
            .select({ authorId: projects.authorId })
            .from(projects)
            .where(inArray(projects.authorId, userIds))
        : Promise.resolve([]),
      userIds.length > 0
        ? db
            .select({ authorId: posts.authorId })
            .from(posts)
            .where(inArray(posts.authorId, userIds))
        : Promise.resolve([]),
      userIds.length > 0
        ? db
            .select({ userId: comments.userId })
            .from(comments)
            .where(inArray(comments.userId, userIds))
        : Promise.resolve([]),
      userIds.length > 0
        ? db.select({ userId: likes.userId }).from(likes).where(inArray(likes.userId, userIds))
        : Promise.resolve([]),
      userIds.length > 0
        ? db
            .select({ id: authUser.id, email: authUser.email })
            .from(authUser)
            .where(inArray(authUser.id, userIds))
        : Promise.resolve([]),
    ]);

    const projectsCount: Record<string, number> = {};
    const postsCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    const likesCount: Record<string, number> = {};

    projectRows.forEach((project) => {
      projectsCount[project.authorId] = (projectsCount[project.authorId] || 0) + 1;
    });

    postRows.forEach((post) => {
      postsCount[post.authorId] = (postsCount[post.authorId] || 0) + 1;
    });

    commentRows.forEach((comment) => {
      if (comment.userId) {
        commentsCount[comment.userId] = (commentsCount[comment.userId] || 0) + 1;
      }
    });

    likeRows.forEach((like) => {
      if (like.userId) {
        likesCount[like.userId] = (likesCount[like.userId] || 0) + 1;
      }
    });

    const emailMap: Record<string, string> = {};
    authRows.forEach((authRow) => {
      emailMap[authRow.id] = authRow.email || "";
    });

    const formattedUsers: AdminUser[] = userRows.map((row) => {
      const mapped = toUserProfile(row);
      return {
        id: mapped.id,
        username: mapped.username,
        display_name: mapped.displayName,
        email: emailMap[mapped.id] || "",
        bio: mapped.bio,
        avatar_url: mapped.avatarUrl,
        location: mapped.location,
        website: mapped.website,
        github_url: mapped.githubUrl,
        twitter_url: mapped.twitterUrl,
        role: mapped.role || 2,
        joined_at: mapped.joinedAt ?? "",
        updated_at: mapped.updatedAt ?? "",
        is_suspended: mapped.isSuspended || false,
        stats: {
          projects_count: projectsCount[mapped.id] || 0,
          posts_count: postsCount[mapped.id] || 0,
          comments_count: commentsCount[mapped.id] || 0,
          likes_received: likesCount[mapped.id] || 0,
        },
      };
    });

    return {
      users: formattedUsers,
      totalCount: totalResult[0]?.value || 0,
    };
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      users: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to load users",
    };
  }
}

export async function updateUserRole(
  userId: string,
  role: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update user role error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}

export async function suspendUser(
  userId: string,
  suspended: boolean,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    await db
      .update(users)
      .set({
        isSuspended: suspended,
        suspensionReason: reason || null,
        suspendedAt: suspended ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Suspend user error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user suspension status",
    };
  }
}

export async function getUserStats(userId: string): Promise<{
  success: boolean;
  stats?: AdminUser["stats"];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const [projectsResult, postsResult, commentsResult, likesResult] = await Promise.all([
      db.select({ value: count() }).from(projects).where(eq(projects.authorId, userId)),
      db.select({ value: count() }).from(posts).where(eq(posts.authorId, userId)),
      db.select({ value: count() }).from(comments).where(eq(comments.userId, userId)),
      db.select({ value: count() }).from(likes).where(eq(likes.userId, userId)),
    ]);

    return {
      success: true,
      stats: {
        projects_count: projectsResult[0]?.value || 0,
        posts_count: postsResult[0]?.value || 0,
        comments_count: commentsResult[0]?.value || 0,
        likes_received: likesResult[0]?.value || 0,
      },
    };
  } catch (error) {
    console.error("Get user stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load user stats",
    };
  }
}
