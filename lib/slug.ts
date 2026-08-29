import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export function slugifyTitle(input: string, maxLen: number = 80): string {
  let base = input.trim().toLowerCase();
  base = base.replace(/[^a-z0-9\s]/g, "");
  base = base.replace(/\s+/g, "-");
  base = base.replace(/^-+|-+$/g, "");

  if (base.length > maxLen) {
    base = base.slice(0, maxLen).replace(/-+$/g, "");
  }

  return base || "project";
}

/** True when a postgres error is a unique-constraint violation (code 23505). */
export function isPgUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

/**
 * Insert with unique-slug retry: try `baseSlug`, then suffixed candidates
 * (`base-2`, `base-3`, …), bounded by `maxAttempts`. The first successful
 * insert wins; the base attempt is the uniqueness check — no separate
 * pre-check SELECT whose race the insert then has to re-cover.
 */
export async function insertWithUniqueSlug<T>(
  baseSlug: string,
  insert: (slug: string) => Promise<T>,
  options: {
    maxAttempts?: number;
    isSlugConflict?: (error: unknown) => boolean;
  } = {},
): Promise<{ slug: string; result: T }> {
  const maxAttempts = options.maxAttempts ?? 100;
  const isSlugConflict = options.isSlugConflict ?? isPgUniqueViolation;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

    try {
      return { slug, result: await insert(slug) };
    } catch (error) {
      if (!isSlugConflict(error) || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error(`Slug uniqueness exhausted after ${maxAttempts} attempts`);
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

export async function getProjectIdBySlug(slug: string): Promise<string | null> {
  if (!slug || !isValidSlug(slug)) {
    return null;
  }

  try {
    const db = getDb();
    const [row] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);

    return row ? String(row.id) : null;
  } catch (error) {
    console.error("Error getting project ID by slug:", error);
    return null;
  }
}
