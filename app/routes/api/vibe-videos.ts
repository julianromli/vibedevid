import { createFileRoute } from "@tanstack/react-router";
import { asc, eq, max } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { vibeVideos } from "@/lib/db/schema";
import { requireAdminOrModeratorUser } from "@/lib/server/auth";

function transformVideo(video: typeof vibeVideos.$inferSelect) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    videoId: video.videoId,
    publishedAt: video.publishedAt,
    viewCount: video.viewCount,
    position: video.position,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}

export const Route = createFileRoute("/api/vibe-videos")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireAdminOrModeratorUser();
          const db = getDb();

          const videos = await db.select().from(vibeVideos).orderBy(asc(vibeVideos.position));

          return Response.json({ videos: videos.map(transformVideo) });
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Unauthorized")) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          console.error("API Error:", error);
          return Response.json(
            { error: "Terjadi error saat mengambil data video cuy!" },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }) => {
        try {
          await requireAdminOrModeratorUser();
          const body = await request.json();
          const { title, description, thumbnail, video_id, published_at, view_count } = body;

          if (!title || !description || !thumbnail || !video_id || !published_at) {
            return Response.json(
              {
                error:
                  "Field title, description, thumbnail, video_id, dan published_at wajib diisi!",
              },
              { status: 400 },
            );
          }

          const db = getDb();

          const [maxPositionResult] = await db
            .select({ maxPosition: max(vibeVideos.position) })
            .from(vibeVideos);

          const nextPosition = (maxPositionResult?.maxPosition ?? 0) + 1;

          const [newVideo] = await db
            .insert(vibeVideos)
            .values({
              title,
              description,
              thumbnail,
              videoId: video_id,
              publishedAt: published_at,
              viewCount: view_count || "0",
              position: nextPosition,
            })
            .returning();

          return Response.json(
            {
              message: "Video berhasil ditambahkan!",
              video: transformVideo(newVideo),
            },
            { status: 201 },
          );
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.startsWith("Unauthorized")) {
              return Response.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message.includes("unique") || error.message.includes("duplicate")) {
              return Response.json(
                { error: "Video dengan ID ini sudah ada dalam database" },
                { status: 409 },
              );
            }
          }
          console.error("API Error:", error);
          return Response.json(
            { error: "Terjadi error saat menambahkan video cuy!" },
            { status: 500 },
          );
        }
      },
    },
  },
});
