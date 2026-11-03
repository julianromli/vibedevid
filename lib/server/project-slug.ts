import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { isValidSlug } from "@/lib/slug";

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
