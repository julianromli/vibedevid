import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export async function getProjectByUUID(uuid: string) {
  const numericId = Number.parseInt(uuid, 10);
  if (Number.isNaN(numericId)) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, numericId))
    .limit(1);

  return row ?? null;
}
