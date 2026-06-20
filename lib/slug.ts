import type React from "react";
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

export async function ensureUniqueSlug(
  baseSlug: string,
  excludeProjectId?: string,
): Promise<string> {
  const db = getDb();
  const excludeId = excludeProjectId ? Number.parseInt(excludeProjectId, 10) : undefined;

  let slug = baseSlug;
  let i = 1;

  while (true) {
    try {
      const [existing] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);

      const isExcluded = existing && excludeId !== undefined && existing.id === excludeId;

      if (!existing || isExcluded) {
        return slug;
      }

      i += 1;
      slug = `${baseSlug}-${i}`;

      if (i > 100) {
        console.warn("Slug collision detection exceeded 100 attempts");
        break;
      }
    } catch (error) {
      console.error("Unexpected error in ensureUniqueSlug:", error);
      break;
    }
  }

  return slug;
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

export type SlugGenerationOptions = {
  maxLength?: number;
  excludeProjectId?: string;
};
