import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
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

export const Route = createFileRoute("/api/vibe-videos/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          await requireAdminOrModeratorUser();
          const { id } = params;

          if (!id) {
            return Response.json({ error: "Video ID diperlukan" }, { status: 400 });
          }

          const db = getDb();
          const [video] = await db.select().from(vibeVideos).where(eq(vibeVideos.id, id)).limit(1);

          if (!video) {
            return Response.json({ error: "Video tidak ditemukan" }, { status: 404 });
          }

          return Response.json({ video: transformVideo(video) });
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

      PUT: async ({ request, params }) => {
        try {
          await requireAdminOrModeratorUser();
          const { id } = params;
          const body = await request.json();
          const { title, description, thumbnail, video_id, published_at, view_count, position } =
            body;

          if (!id) {
            return Response.json({ error: "Video ID diperlukan" }, { status: 400 });
          }

          if (
            !title &&
            !description &&
            !thumbnail &&
            !video_id &&
            !published_at &&
            !view_count &&
            position === undefined
          ) {
            return Response.json(
              { error: "Minimal satu field harus diisi untuk update!" },
              { status: 400 },
            );
          }

          const db = getDb();
          const updateData: Partial<typeof vibeVideos.$inferInsert> = {
            updatedAt: new Date(),
          };

          if (title !== undefined) updateData.title = title;
          if (description !== undefined) updateData.description = description;
          if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
          if (video_id !== undefined) updateData.videoId = video_id;
          if (published_at !== undefined) updateData.publishedAt = published_at;
          if (view_count !== undefined) updateData.viewCount = view_count;
          if (position !== undefined) updateData.position = position;

          const [updatedVideo] = await db
            .update(vibeVideos)
            .set(updateData)
            .where(eq(vibeVideos.id, id))
            .returning();

          if (!updatedVideo) {
            return Response.json({ error: "Video tidak ditemukan" }, { status: 404 });
          }

          return Response.json({
            message: "Video berhasil diupdate!",
            video: transformVideo(updatedVideo),
          });
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
            { error: "Terjadi error saat mengupdate video cuy!" },
            { status: 500 },
          );
        }
      },

      DELETE: async ({ params }) => {
        try {
          await requireAdminOrModeratorUser();
          const { id } = params;

          if (!id) {
            return Response.json({ error: "Video ID diperlukan" }, { status: 400 });
          }

          const db = getDb();

          const [videoToDelete] = await db
            .select({ title: vibeVideos.title })
            .from(vibeVideos)
            .where(eq(vibeVideos.id, id))
            .limit(1);

          await db.delete(vibeVideos).where(eq(vibeVideos.id, id));

          return Response.json({
            message: `Video "${videoToDelete?.title || "Unknown"}" berhasil dihapus!`,
          });
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Unauthorized")) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          console.error("API Error:", error);
          return Response.json(
            { error: "Terjadi error saat menghapus video cuy!" },
            { status: 500 },
          );
        }
      },
    },
  },
});
