import { revalidatePath } from "@/lib/revalidation";
import { getDb } from "@/lib/db";
import { blogReports, comments, users, posts, projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/server/auth";
import { requireAdmin } from "@/lib/auth/permissions";
import { eq, and, gte, lte, desc, count, inArray } from "drizzle-orm";

const DEFAULT_PAGE_SIZE = 20;

export interface ReportedComment {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string | null;
    author_name: string | null;
    author: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    isGuest: boolean;
  };
  reporter: {
    id: string;
    display_name: string;
    username: string;
  };
  entity_type: "post" | "project";
  entity_id: string;
  entity_title: string;
}

export interface GetReportedCommentsResult {
  reports: ReportedComment[];
  totalCount: number;
  error?: string;
}

export interface ReportFilters {
  status?: "all" | "pending" | "reviewed" | "dismissed";
  dateFrom?: string;
  dateTo?: string;
}

async function checkAdminAccess() {
  const user = await requireUser();
  await requireAdmin(user.id);
  return user;
}

export async function getReportedComments(
  filters: ReportFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetReportedCommentsResult> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const conditions = [];

    if (filters.status && filters.status !== "all") {
      conditions.push(eq(blogReports.status, filters.status));
    }
    if (filters.dateFrom) {
      conditions.push(gte(blogReports.createdAt, new Date(filters.dateFrom)));
    }
    if (filters.dateTo) {
      conditions.push(lte(blogReports.createdAt, new Date(filters.dateTo)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [totalResult, reportRows] = await Promise.all([
      db.select({ value: count() }).from(blogReports).where(whereClause),
      db
        .select({
          id: blogReports.id,
          commentId: blogReports.commentId,
          reporterId: blogReports.reporterId,
          reason: blogReports.reason,
          status: blogReports.status,
          createdAt: blogReports.createdAt,
          commentContent: comments.content,
          commentCreatedAt: comments.createdAt,
          commentUserId: comments.userId,
          commentAuthorName: comments.authorName,
          commentPostId: comments.postId,
          commentProjectId: comments.projectId,
          authorId: users.id,
          authorDisplayName: users.displayName,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(blogReports)
        .leftJoin(comments, eq(blogReports.commentId, comments.id))
        .leftJoin(users, eq(comments.userId, users.id))
        .where(whereClause)
        .orderBy(desc(blogReports.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const commentIds = reportRows.map((r) => r.commentId).filter(Boolean) as string[];

    const allComments =
      commentIds.length > 0
        ? await db
            .select({ id: comments.id, postId: comments.postId, projectId: comments.projectId })
            .from(comments)
            .where(inArray(comments.id, commentIds))
        : [];

    const commentEntityMap = new Map<string, { type: "post" | "project"; entityId: string }>();
    allComments.forEach((comment) => {
      if (comment.postId) {
        commentEntityMap.set(comment.id, { type: "post", entityId: comment.postId });
      } else if (comment.projectId) {
        commentEntityMap.set(comment.id, { type: "project", entityId: String(comment.projectId) });
      }
    });

    const postIds = [...new Set(allComments.filter((c) => c.postId).map((c) => c.postId!))];
    const projectIds = [
      ...new Set(allComments.filter((c) => c.projectId).map((c) => c.projectId!)),
    ];

    const [postRows, projectRows, reporterRows] = await Promise.all([
      postIds.length > 0
        ? db
            .select({ id: posts.id, title: posts.title })
            .from(posts)
            .where(inArray(posts.id, postIds))
        : Promise.resolve([]),
      projectIds.length > 0
        ? db
            .select({ id: projects.id, title: projects.title })
            .from(projects)
            .where(inArray(projects.id, projectIds))
        : Promise.resolve([]),
      db
        .select({
          reportId: blogReports.id,
          reporterId: blogReports.reporterId,
          displayName: users.displayName,
          username: users.username,
        })
        .from(blogReports)
        .leftJoin(users, eq(blogReports.reporterId, users.id))
        .where(whereClause),
    ]);

    const postMap = new Map<string, string>(postRows.map((p) => [p.id, p.title]));
    const projectMap = new Map<number, string>(projectRows.map((p) => [p.id, p.title]));
    const reporterMap = new Map(
      reporterRows.map((r) => [
        r.reportId,
        {
          id: r.reporterId || "",
          display_name: r.displayName || "Unknown",
          username: r.username || "unknown",
        },
      ]),
    );

    const formattedReports: ReportedComment[] = reportRows.map((report) => {
      const entityInfo = report.commentId ? commentEntityMap.get(report.commentId) : undefined;
      let entity_type: "post" | "project" = "post";
      let entity_id = "";
      let entity_title = "Unknown";

      if (entityInfo) {
        entity_type = entityInfo.type;
        entity_id = entityInfo.entityId;
        entity_title =
          entityInfo.type === "post"
            ? postMap.get(entityInfo.entityId) || "Unknown Post"
            : projectMap.get(Number(entityInfo.entityId)) || "Unknown Project";
      }

      const reporter = reporterMap.get(report.id);

      return {
        id: report.id,
        comment_id: report.commentId || "",
        reporter_id: report.reporterId || "",
        reason: report.reason,
        status: (report.status || "pending") as ReportedComment["status"],
        created_at: report.createdAt?.toISOString() ?? "",
        comment: {
          id: report.commentId || "",
          content: report.commentContent || "",
          created_at: report.commentCreatedAt?.toISOString() ?? "",
          user_id: report.commentUserId,
          author_name: report.commentAuthorName,
          author: report.authorId
            ? {
                id: report.authorId,
                display_name: report.authorDisplayName || "",
                avatar_url: report.authorAvatarUrl,
              }
            : null,
          isGuest: !report.commentUserId,
        },
        reporter: reporter || {
          id: report.reporterId || "",
          display_name: "Unknown",
          username: "unknown",
        },
        entity_type,
        entity_id,
        entity_title,
      };
    });

    return {
      reports: formattedReports,
      totalCount: totalResult[0]?.value || 0,
    };
  } catch (error) {
    console.error("Get reported comments error:", error);
    return {
      reports: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to load reports",
    };
  }
}

export async function adminDeleteComment(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const [comment] = await db
      .select({ postId: comments.postId, projectId: comments.projectId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    await db.delete(blogReports).where(eq(blogReports.commentId, commentId));

    const deletedRows = await db
      .delete(comments)
      .where(eq(comments.id, commentId))
      .returning({ id: comments.id });

    if (!deletedRows.length) {
      return { success: false, error: "Comment could not be deleted" };
    }

    if (comment?.postId) {
      revalidatePath("/blog/[slug]");
      revalidatePath("/blog");
    }
    if (comment?.projectId) {
      revalidatePath("/project/[slug]");
      revalidatePath("/project/list");
    }
    revalidatePath("/admin/dashboard/boards/comments");

    return { success: true };
  } catch (error) {
    console.error("Admin delete comment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete comment",
    };
  }
}

export async function dismissReport(
  reportId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const updatedRows = await db
      .update(blogReports)
      .set({ status: "dismissed" })
      .where(eq(blogReports.id, reportId))
      .returning({ id: blogReports.id });

    if (!updatedRows.length) {
      return { success: false, error: "Report not found" };
    }

    revalidatePath("/admin/dashboard/boards/comments");

    return { success: true };
  } catch (error) {
    console.error("Dismiss report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to dismiss report",
    };
  }
}

export async function takeActionOnReport(
  reportId: string,
  action: "delete" | "dismiss" | "warn",
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess();

    const db = getDb();

    const [report] = await db
      .select({ commentId: blogReports.commentId })
      .from(blogReports)
      .where(eq(blogReports.id, reportId))
      .limit(1);

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    if (action === "delete") {
      const result = await adminDeleteComment(report.commentId!);
      if (!result.success) {
        return result;
      }

      const updatedRows = await db
        .update(blogReports)
        .set({ status: "reviewed" })
        .where(eq(blogReports.id, reportId))
        .returning({ id: blogReports.id });

      if (!updatedRows.length) {
        return { success: false, error: "Report not found" };
      }
    } else if (action === "dismiss") {
      return await dismissReport(reportId);
    } else if (action === "warn") {
      const updatedRows = await db
        .update(blogReports)
        .set({ status: "reviewed" })
        .where(eq(blogReports.id, reportId))
        .returning({ id: blogReports.id });

      if (!updatedRows.length) {
        return { success: false, error: "Report not found" };
      }
    }

    revalidatePath("/admin/dashboard/boards/comments");

    return { success: true };
  } catch (error) {
    console.error("Take action on report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to take action",
    };
  }
}

export async function getCommentModerationStats(): Promise<{
  success: boolean;
  stats?: {
    total_reports: number;
    pending_reports: number;
    reviewed_reports: number;
    dismissed_reports: number;
  };
  error?: string;
}> {
  try {
    await checkAdminAccess();

    const db = getDb();
    const reportRows = await db.select({ status: blogReports.status }).from(blogReports);

    const stats = {
      total_reports: reportRows.length,
      pending_reports: reportRows.filter((r) => r.status === "pending").length,
      reviewed_reports: reportRows.filter((r) => r.status === "reviewed").length,
      dismissed_reports: reportRows.filter((r) => r.status === "dismissed").length,
    };

    return { success: true, stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load stats",
    };
  }
}
