import { and, asc, eq, ne } from "drizzle-orm";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import { getDb } from "@/lib/db";
import { toEventDto } from "@/lib/db/mappers";
import { events } from "@/lib/db/schema";
import type { EventDto } from "@/types/domain";

export async function fetchApprovedEvents(): Promise<EventDto[]> {
  return cachedGet({
    key: CACHE_KEYS.eventList,
    ttlSeconds: CACHE_TTL.eventList,
    loader: async () => {
      const db = getDb();
      const rows = await db
        .select()
        .from(events)
        .where(eq(events.approved, true))
        .orderBy(asc(events.date));
      return rows.map(toEventDto);
    },
    fallback: () => [],
  });
}

export async function fetchEventBySlug(slug: string): Promise<EventDto | null> {
  const sanitizedSlug = slug.trim().toLowerCase();
  if (!sanitizedSlug || sanitizedSlug.length > 200) {
    return null;
  }

  const db = getDb();
  const [row] = await db.select().from(events).where(eq(events.slug, sanitizedSlug)).limit(1);

  return row ? toEventDto(row) : null;
}

export async function fetchRelatedEvents(
  category: string,
  excludeId: string,
  limit: number = 3,
): Promise<EventDto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.category, category), eq(events.approved, true), ne(events.id, excludeId)))
    .limit(limit);

  return rows.map(toEventDto);
}
