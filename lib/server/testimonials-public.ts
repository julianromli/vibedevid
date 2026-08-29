import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";
import {
  getCachedJson,
  invalidateCached,
  setCachedJson,
  SHORT_TTL_CACHE_KEYS,
} from "@/lib/server/short-ttl-cache";
import type { Testimonial } from "@/types/homepage";

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const cached = await getCachedJson<Testimonial[]>(SHORT_TTL_CACHE_KEYS.testimonials);
    if (cached) {
      return cached;
    }

    const db = getDb();
    const rows = await db
      .select({
        id: testimonials.id,
        fullName: testimonials.fullName,
        role: testimonials.role,
        body: testimonials.body,
        avatarUrl: testimonials.avatarUrl,
      })
      .from(testimonials)
      .where(eq(testimonials.status, "approved"))
      .orderBy(desc(testimonials.approvedAt));

    const mapped: Testimonial[] = rows.map((row) => ({
      id: row.id,
      name: row.fullName,
      role: row.role,
      text: row.body,
      image: row.avatarUrl,
    }));

    await setCachedJson(SHORT_TTL_CACHE_KEYS.testimonials, mapped);
    return mapped;
  } catch (error) {
    console.error(
      "[getApprovedTestimonials] failed:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

export async function invalidateApprovedTestimonialsCache(): Promise<void> {
  await invalidateCached(SHORT_TTL_CACHE_KEYS.testimonials);
}
