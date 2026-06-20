import { revalidatePath } from "@/lib/revalidation";
import { getDb } from "@/lib/db";
import { comments, users, blogReports } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";
import { eq, desc } from "drizzle-orm";
import type {
  Comment,
  CommentEntityType,
  CommentResult,
  CreateCommentInput,
  GetCommentsResult,
} from "@/types/comments";

const getRevalidatePath = (entityType: CommentEntityType): string =>
  entityType === "post" ? "/blog" : "/project";

export async function createComment(input: CreateCommentInput): Promise<CommentResult> {
  const { entityType, entityId, content, guestName } = input;

  if (!entityId || !content) {
    return { success: false, error: "Entity ID and content are required" };
  }

  if (content.trim().length < 2) {
    return { success: false, error: "Comment too short (minimum 2 characters)" };
  }

  const session = await getServerSession();
  const userId = session?.user?.id ?? null;
  const db = getDb();

  const insertValues: {
    content: string;
    userId: string | null;
    authorName?: string;
    postId?: string;
    projectId?: number;
  } = {
    content: content.trim(),
    userId,
  };

  if (entityType === "post") {
    insertValues.postId = entityId;
  } else {
    const projectId = Number(entityId);
    if (!Number.isInteger(projectId)) {
      return { success: false, error: "Invalid project ID" };
    }
    insertValues.projectId = projectId;
  }

  if (!userId && guestName) {
    insertValues.authorName = guestName.trim();
  }

  try {
    await db.insert(comments).values(insertValues);
  } catch (error) {
    console.error("Create comment error:", error);
    return { success: false, error: "Failed to add comment" };
  }

  revalidatePath(getRevalidatePath(entityType));
  return { success: true };
}

export async function getComments(
  entityType: CommentEntityType,
  entityId: string,
): Promise<GetCommentsResult> {
  if (!entityId) {
    return { comments: [], error: "Entity ID is required" };
  }

  const db = getDb();

  const whereClause =
    entityType === "post"
      ? eq(comments.postId, entityId)
      : eq(comments.projectId, Number(entityId));

  try {
    const rows = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
        authorName: comments.authorName,
        userProfileId: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(whereClause)
      .orderBy(desc(comments.createdAt));

    const normalized: Comment[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt?.toISOString() ?? "",
      isGuest: !row.userId,
      author: row.userProfileId
        ? {
            id: row.userProfileId,
            displayName: row.displayName ?? "",
            avatarUrl: row.avatarUrl,
            role: row.role,
          }
        : row.authorName
          ? {
              id: "guest",
              displayName: row.authorName,
              avatarUrl: null,
              role: null,
            }
          : null,
    }));

    return { comments: normalized };
  } catch (error) {
    console.error("Get comments error:", error);
    return { comments: [], error: "Failed to load comments" };
  }
}

export async function reportComment(commentId: string, reason: string): Promise<CommentResult> {
  const session = await getServerSession();

  if (!session?.user) {
    return { success: false, error: "You must be logged in to report comments" };
  }

  if (!commentId || !reason) {
    return { success: false, error: "Comment ID and reason are required" };
  }

  const db = getDb();

  try {
    await db.insert(blogReports).values({
      commentId,
      reporterId: session.user.id,
      reason: reason.trim(),
    });
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "You have already reported this comment" };
    }
    console.error("Report comment error:", error);
    return { success: false, error: "Failed to report comment" };
  }

  return { success: true };
}
