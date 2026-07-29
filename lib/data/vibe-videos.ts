import { asc } from "drizzle-orm";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import staticVibeVideos from "@/lib/data/static/vibe-videos.json";
import { getDb } from "@/lib/db";
import { vibeVideos } from "@/lib/db/schema";
import { getVideoIconKey } from "@/lib/video-icon-key";
import type { VibeVideo } from "@/types/homepage";

function getStaticVibeVideos(): VibeVideo[] {
  return staticVibeVideos.map((video) => ({
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    videoId: video.videoId,
    publishedAt: video.publishedAt,
    viewCount: video.viewCount,
    iconKey: video.iconKey as VibeVideo["iconKey"],
  }));
}

async function loadVibeVideosFromDb(): Promise<VibeVideo[]> {
  const db = getDb();
  const data = await db.select().from(vibeVideos).orderBy(asc(vibeVideos.position));

  if (!data.length) {
    return getStaticVibeVideos();
  }

  return data.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    videoId: video.videoId,
    publishedAt: video.publishedAt,
    viewCount: video.viewCount ?? "0",
    position: video.position,
    iconKey: getVideoIconKey(video.title, video.description),
  }));
}

export async function getVibeVideos(): Promise<VibeVideo[]> {
  try {
    return await cachedGet({
      key: CACHE_KEYS.vibeVideos,
      ttlSeconds: CACHE_TTL.vibeVideos,
      loader: loadVibeVideosFromDb,
      fallback: getStaticVibeVideos,
    });
  } catch (error) {
    console.error(
      "[getVibeVideos] failed:",
      error instanceof Error ? error.message : String(error),
    );
    return getStaticVibeVideos();
  }
}
