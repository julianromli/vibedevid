import { getDb } from "@/lib/db";
import {
  users,
  projects,
  posts,
  comments,
  likes,
  views,
  events,
  blogReports,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { eq, and, gte, lte, count, desc, inArray } from "drizzle-orm";

export interface PlatformStats {
  total_users: number;
  total_projects: number;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  total_views: number;
  new_users_today: number;
  new_projects_today: number;
  new_posts_today: number;
}

export interface TrendingItem {
  id: string | number;
  title: string;
  views: number;
  likes: number;
  author: string;
  created_at: string;
}

export interface ContentGrowthPoint {
  date: string;
  users: number;
  projects: number;
  posts: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface RoleCount {
  role: "admin" | "moderator" | "user";
  label: string;
  count: number;
}

export interface StatusCount {
  status: string;
  label: string;
  count: number;
}

export interface CommunityHealthCounts {
  pending_events: number;
  approved_events: number;
  pending_reports: number;
  featured_projects: number;
  featured_posts: number;
  suspended_users: number;
}

function buildDateRange(days: number) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return {
    startIso: startDate.toISOString(),
    startDateKey: startDate.toISOString().split("T")[0],
    endDateKey: endDate.toISOString().split("T")[0],
    days,
  };
}

function initDateMap(days: number, startDate: Date) {
  const dateMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dateMap.set(date.toISOString().split("T")[0], 0);
  }
  return dateMap;
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

export async function getPlatformStats(): Promise<{
  success: boolean;
  stats?: PlatformStats;
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(today);

    const [
      usersResult,
      projectsResult,
      postsResult,
      commentsResult,
      likesResult,
      viewsResult,
      newUsersToday,
      newProjectsToday,
      newPostsToday,
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(projects),
      db.select({ value: count() }).from(posts),
      db.select({ value: count() }).from(comments),
      db.select({ value: count() }).from(likes),
      db.select({ value: count() }).from(views),
      db.select({ value: count() }).from(users).where(gte(users.joinedAt, todayStart)),
      db.select({ value: count() }).from(projects).where(gte(projects.createdAt, todayStart)),
      db.select({ value: count() }).from(posts).where(gte(posts.createdAt, todayStart)),
    ]);

    return {
      success: true,
      stats: {
        total_users: usersResult[0]?.value || 0,
        total_projects: projectsResult[0]?.value || 0,
        total_posts: postsResult[0]?.value || 0,
        total_comments: commentsResult[0]?.value || 0,
        total_likes: likesResult[0]?.value || 0,
        total_views: viewsResult[0]?.value || 0,
        new_users_today: newUsersToday[0]?.value || 0,
        new_projects_today: newProjectsToday[0]?.value || 0,
        new_posts_today: newPostsToday[0]?.value || 0,
      },
    };
  } catch (error) {
    console.error("Get platform stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load platform stats",
    };
  }
}

export async function getMostViewedProjects(limit: number = 10): Promise<{
  success: boolean;
  projects?: TrendingItem[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const projectRows = await db
      .select({
        id: projects.id,
        title: projects.title,
        createdAt: projects.createdAt,
        authorName: users.displayName,
      })
      .from(projects)
      .innerJoin(users, eq(projects.authorId, users.id))
      .orderBy(desc(projects.createdAt))
      .limit(100);

    const projectIds = projectRows.map((p) => p.id);

    const [viewRows, likeRows] = await Promise.all([
      projectIds.length > 0
        ? db
            .select({ projectId: views.projectId })
            .from(views)
            .where(inArray(views.projectId, projectIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select({ projectId: likes.projectId })
            .from(likes)
            .where(inArray(likes.projectId, projectIds))
        : Promise.resolve([]),
    ]);

    const viewsCount: Record<number, number> = {};
    const likesCount: Record<number, number> = {};

    viewRows.forEach((view) => {
      if (view.projectId) {
        viewsCount[view.projectId] = (viewsCount[view.projectId] || 0) + 1;
      }
    });

    likeRows.forEach((like) => {
      if (like.projectId) {
        likesCount[like.projectId] = (likesCount[like.projectId] || 0) + 1;
      }
    });

    const formattedProjects: TrendingItem[] = projectRows.map((project) => ({
      id: project.id,
      title: project.title,
      views: viewsCount[project.id] || 0,
      likes: likesCount[project.id] || 0,
      author: project.authorName || "Unknown",
      created_at: project.createdAt?.toISOString() ?? "",
    }));

    formattedProjects.sort((a, b) => b.views - a.views);

    return {
      success: true,
      projects: formattedProjects.slice(0, limit),
    };
  } catch (error) {
    console.error("Get most viewed projects error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load projects",
    };
  }
}

export async function getMostViewedPosts(limit: number = 10): Promise<{
  success: boolean;
  posts?: TrendingItem[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        authorName: users.displayName,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.viewCount))
      .limit(limit);

    const postIds = postRows.map((p) => p.id);

    const likeRows =
      postIds.length > 0
        ? await db
            .select({ postId: likes.postId })
            .from(likes)
            .where(inArray(likes.postId, postIds))
        : [];

    const likesCount: Record<string, number> = {};
    likeRows.forEach((like) => {
      if (like.postId) {
        likesCount[like.postId] = (likesCount[like.postId] || 0) + 1;
      }
    });

    const formattedPosts: TrendingItem[] = postRows.map((post) => ({
      id: post.id,
      title: post.title,
      views: post.viewCount || 0,
      likes: likesCount[post.id] || 0,
      author: post.authorName || "Unknown",
      created_at: post.createdAt?.toISOString() ?? "",
    }));

    return {
      success: true,
      posts: formattedPosts,
    };
  } catch (error) {
    console.error("Get most viewed posts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load posts",
    };
  }
}

export async function getContentGrowthTimeSeries(days: number = 30): Promise<{
  success: boolean;
  data?: ContentGrowthPoint[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const { startIso, days: rangeDays, startDateKey } = buildDateRange(days);
    const startDate = new Date(startIso);

    const [usersResult, projectsResult, postsResult] = await Promise.all([
      db.select({ joinedAt: users.joinedAt }).from(users).where(gte(users.joinedAt, startDate)),
      db
        .select({ createdAt: projects.createdAt })
        .from(projects)
        .where(gte(projects.createdAt, startDate)),
      db.select({ createdAt: posts.createdAt }).from(posts).where(gte(posts.createdAt, startDate)),
    ]);

    const usersByDate = initDateMap(rangeDays, startDate);
    const projectsByDate = initDateMap(rangeDays, startDate);
    const postsByDate = initDateMap(rangeDays, startDate);

    usersResult.forEach((row) => {
      if (row.joinedAt) {
        const key = row.joinedAt.toISOString().split("T")[0];
        if (usersByDate.has(key)) usersByDate.set(key, (usersByDate.get(key) || 0) + 1);
      }
    });

    projectsResult.forEach((row) => {
      if (row.createdAt) {
        const key = row.createdAt.toISOString().split("T")[0];
        if (projectsByDate.has(key)) projectsByDate.set(key, (projectsByDate.get(key) || 0) + 1);
      }
    });

    postsResult.forEach((row) => {
      if (row.createdAt) {
        const key = row.createdAt.toISOString().split("T")[0];
        if (postsByDate.has(key)) postsByDate.set(key, (postsByDate.get(key) || 0) + 1);
      }
    });

    const dates = Array.from(usersByDate.keys()).sort();
    const data: ContentGrowthPoint[] = dates
      .filter((date) => date >= startDateKey)
      .map((date) => ({
        date,
        users: usersByDate.get(date) || 0,
        projects: projectsByDate.get(date) || 0,
        posts: postsByDate.get(date) || 0,
      }));

    return { success: true, data };
  } catch (error) {
    console.error("Get content growth time series error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load content growth",
    };
  }
}

export async function getProjectsByCategory(limit: number = 8): Promise<{
  success: boolean;
  categories?: CategoryCount[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const data = await db.select({ category: projects.category }).from(projects);

    const counts = new Map<string, number>();
    data.forEach((row) => {
      const category = row.category?.trim() || "Uncategorized";
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    const categories = Array.from(counts.entries())
      .map(([category, countValue]) => ({ category, count: countValue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { success: true, categories };
  } catch (error) {
    console.error("Get projects by category error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load project categories",
    };
  }
}

export async function getUsersByRole(): Promise<{
  success: boolean;
  roles?: RoleCount[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const data = await db.select({ role: users.role }).from(users);

    const counts = { admin: 0, moderator: 0, user: 0 };
    data.forEach((row) => {
      if (row.role === 0) counts.admin++;
      else if (row.role === 1) counts.moderator++;
      else counts.user++;
    });

    return {
      success: true,
      roles: [
        { role: "admin", label: "Admin", count: counts.admin },
        { role: "moderator", label: "Moderator", count: counts.moderator },
        { role: "user", label: "User", count: counts.user },
      ],
    };
  } catch (error) {
    console.error("Get users by role error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load user roles",
    };
  }
}

export async function getPostsByStatus(): Promise<{
  success: boolean;
  statuses?: StatusCount[];
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const [draft, published, archived] = await Promise.all([
      db.select({ value: count() }).from(posts).where(eq(posts.status, "draft")),
      db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
      db.select({ value: count() }).from(posts).where(eq(posts.status, "archived")),
    ]);

    return {
      success: true,
      statuses: [
        { status: "published", label: "Published", count: published[0]?.value || 0 },
        { status: "draft", label: "Draft", count: draft[0]?.value || 0 },
        { status: "archived", label: "Archived", count: archived[0]?.value || 0 },
      ],
    };
  } catch (error) {
    console.error("Get posts by status error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load post statuses",
    };
  }
}

export async function getCommunityHealthCounts(): Promise<{
  success: boolean;
  counts?: CommunityHealthCounts;
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const [
      pendingEvents,
      approvedEvents,
      pendingReports,
      featuredProjects,
      featuredPosts,
      suspendedUsers,
    ] = await Promise.all([
      db.select({ value: count() }).from(events).where(eq(events.approved, false)),
      db.select({ value: count() }).from(events).where(eq(events.approved, true)),
      db.select({ value: count() }).from(blogReports).where(eq(blogReports.status, "pending")),
      db.select({ value: count() }).from(projects).where(eq(projects.featured, true)),
      db.select({ value: count() }).from(posts).where(eq(posts.featured, true)),
      db.select({ value: count() }).from(users).where(eq(users.isSuspended, true)),
    ]);

    return {
      success: true,
      counts: {
        pending_events: pendingEvents[0]?.value || 0,
        approved_events: approvedEvents[0]?.value || 0,
        pending_reports: pendingReports[0]?.value || 0,
        featured_projects: featuredProjects[0]?.value || 0,
        featured_posts: featuredPosts[0]?.value || 0,
        suspended_users: suspendedUsers[0]?.value || 0,
      },
    };
  } catch (error) {
    console.error("Get community health counts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load community health",
    };
  }
}

export async function getPeriodSignupStats(days: number = 30): Promise<{
  success: boolean;
  new_users?: number;
  new_projects?: number;
  new_posts?: number;
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const { startIso } = buildDateRange(days);
    const startDate = new Date(startIso);

    const [usersResult, projectsResult, postsResult] = await Promise.all([
      db.select({ value: count() }).from(users).where(gte(users.joinedAt, startDate)),
      db.select({ value: count() }).from(projects).where(gte(projects.createdAt, startDate)),
      db.select({ value: count() }).from(posts).where(gte(posts.createdAt, startDate)),
    ]);

    return {
      success: true,
      new_users: usersResult[0]?.value || 0,
      new_projects: projectsResult[0]?.value || 0,
      new_posts: postsResult[0]?.value || 0,
    };
  } catch (error) {
    console.error("Get period signup stats error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load period stats",
    };
  }
}

export async function getAnalyticsTimeSeries(days: number = 30): Promise<{
  success: boolean;
  data?: {
    dates: string[];
    views: number[];
    likes: number[];
    comments: number[];
  };
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateKey = startDate.toISOString().split("T")[0];
    const endDateKey = endDate.toISOString().split("T")[0];

    const [viewRows, likeRows, commentRows] = await Promise.all([
      db
        .select({ viewDate: views.viewDate })
        .from(views)
        .where(and(gte(views.viewDate, startDateKey), lte(views.viewDate, endDateKey))),
      db.select({ createdAt: likes.createdAt }).from(likes).where(gte(likes.createdAt, startDate)),
      db
        .select({ createdAt: comments.createdAt })
        .from(comments)
        .where(gte(comments.createdAt, startDate)),
    ]);

    const dateMap = new Map<string, { views: number; likes: number; comments: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, { views: 0, likes: 0, comments: 0 });
    }

    viewRows.forEach((view) => {
      if (view.viewDate) {
        const current = dateMap.get(view.viewDate) || { views: 0, likes: 0, comments: 0 };
        current.views++;
        dateMap.set(view.viewDate, current);
      }
    });

    likeRows.forEach((like) => {
      if (like.createdAt) {
        const dateStr = like.createdAt.toISOString().split("T")[0];
        const current = dateMap.get(dateStr) || { views: 0, likes: 0, comments: 0 };
        current.likes++;
        dateMap.set(dateStr, current);
      }
    });

    commentRows.forEach((comment) => {
      if (comment.createdAt) {
        const dateStr = comment.createdAt.toISOString().split("T")[0];
        const current = dateMap.get(dateStr) || { views: 0, likes: 0, comments: 0 };
        current.comments++;
        dateMap.set(dateStr, current);
      }
    });

    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      success: true,
      data: {
        dates: sortedDates.map(([date]) => date),
        views: sortedDates.map(([, data]) => data.views),
        likes: sortedDates.map(([, data]) => data.likes),
        comments: sortedDates.map(([, data]) => data.comments),
      },
    };
  } catch (error) {
    console.error("Get analytics time series error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load analytics",
    };
  }
}
