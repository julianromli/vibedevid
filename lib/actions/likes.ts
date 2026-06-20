import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { likes, projects } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";

async function resolveProjectId(identifier: string): Promise<number | null> {
  const db = getDb();
  const numericId = Number.parseInt(identifier, 10);

  if (!Number.isNaN(numericId) && String(numericId) === identifier.trim()) {
    const [row] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, numericId))
      .limit(1);
    return row?.id ?? null;
  }

  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, identifier))
    .limit(1);

  return row?.id ?? null;
}

export const getProjectLikeStatusFn = createServerFn({ method: "GET" })
  .validator(z.object({ projectIdentifier: z.string().min(1) }))
  .handler(async ({ data: { projectIdentifier } }) => {
    const session = await getServerSession();
    const db = getDb();

    try {
      const projectId = await resolveProjectId(projectIdentifier);
      if (projectId == null) {
        return { totalLikes: 0, isLiked: false, error: "Project not found" };
      }

      const [countResult] = await db
        .select({ total: count() })
        .from(likes)
        .where(eq(likes.projectId, projectId));

      let isLiked = false;
      if (session?.user) {
        const [userLike] = await db
          .select({ id: likes.id })
          .from(likes)
          .where(and(eq(likes.projectId, projectId), eq(likes.userId, session.user.id)))
          .limit(1);

        isLiked = !!userLike;
      }

      return { totalLikes: countResult?.total ?? 0, isLiked, error: null };
    } catch (error) {
      console.error("Get like status error:", error);
      return { totalLikes: 0, isLiked: false, error: "Failed to load like status" };
    }
  });

export const toggleLikeFn = createServerFn({ method: "POST" })
  .validator(z.object({ projectIdentifier: z.string().min(1) }))
  .handler(async ({ data: { projectIdentifier } }) => {
    const session = await getServerSession();
    if (!session?.user) {
      return { error: "You must be logged in to like projects" };
    }

    const db = getDb();

    try {
      const projectId = await resolveProjectId(projectIdentifier);
      if (projectId == null) {
        return { error: "Project not found" };
      }

      const [existingLike] = await db
        .select({ id: likes.id })
        .from(likes)
        .where(and(eq(likes.projectId, projectId), eq(likes.userId, session.user.id)))
        .limit(1);

      if (existingLike) {
        await db.delete(likes).where(eq(likes.id, existingLike.id));
      } else {
        await db.insert(likes).values({
          projectId,
          userId: session.user.id,
        });
      }

      const [countResult] = await db
        .select({ total: count() })
        .from(likes)
        .where(eq(likes.projectId, projectId));

      const isLiked = !existingLike;

      return {
        success: true,
        isLiked,
        totalLikes: countResult?.total ?? 0,
        error: null,
      };
    } catch (error) {
      console.error("Toggle like error:", error);
      return { error: "An unexpected error occurred. Please try again." };
    }
  });
