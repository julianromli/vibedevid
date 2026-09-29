import { and, eq, inArray, notInArray } from "drizzle-orm";
import type { KnownProjectUpload } from "@/lib/project-images";
import { getDb } from "@/lib/db";
import { projectUploadFiles } from "@/lib/db/schema";

export async function recordProjectUpload(input: {
  key: string;
  url: string;
  userId: string;
}): Promise<void> {
  const key = input.key.trim();
  const url = input.url.trim();
  const userId = input.userId.trim();
  if (!key || !url || !userId) return;

  const db = getDb();
  await db
    .insert(projectUploadFiles)
    .values({ key, url, userId })
    .onConflictDoNothing({ target: projectUploadFiles.key });
}

export async function listOwnedProjectUploads(
  userId: string,
  keys: string[],
): Promise<KnownProjectUpload[]> {
  const normalized = Array.from(new Set(keys.map((key) => key.trim()).filter(Boolean)));
  if (!userId || normalized.length === 0) return [];

  const db = getDb();
  const rows = await db
    .select({
      key: projectUploadFiles.key,
      url: projectUploadFiles.url,
      userId: projectUploadFiles.userId,
      projectId: projectUploadFiles.projectId,
    })
    .from(projectUploadFiles)
    .where(and(eq(projectUploadFiles.userId, userId), inArray(projectUploadFiles.key, normalized)));

  return rows;
}

/**
 * Delete is allowed only for an unattached file this user uploaded.
 * Returns the key when the caller may delete it.
 */
export async function claimProvisionalUploadKey(
  userId: string,
  imageKey: string,
): Promise<string | null> {
  const key = imageKey.trim();
  if (!userId || !key) return null;

  const db = getDb();
  const [row] = await db
    .select({ key: projectUploadFiles.key, projectId: projectUploadFiles.projectId })
    .from(projectUploadFiles)
    .where(and(eq(projectUploadFiles.key, key), eq(projectUploadFiles.userId, userId)))
    .limit(1);

  if (!row || row.projectId != null) return null;
  return row.key;
}

export async function forgetProjectUpload(key: string): Promise<void> {
  const db = getDb();
  await db.delete(projectUploadFiles).where(eq(projectUploadFiles.key, key));
}

export async function syncProjectUploadAttachments(
  userId: string,
  projectId: number,
  keptKeys: string[],
): Promise<void> {
  const db = getDb();
  const keys = Array.from(new Set(keptKeys.map((key) => key.trim()).filter(Boolean)));

  if (keys.length === 0) {
    await db
      .update(projectUploadFiles)
      .set({ projectId: null })
      .where(eq(projectUploadFiles.projectId, projectId));
  } else {
    await db
      .update(projectUploadFiles)
      .set({ projectId: null })
      .where(
        and(eq(projectUploadFiles.projectId, projectId), notInArray(projectUploadFiles.key, keys)),
      );
    await db
      .update(projectUploadFiles)
      .set({ projectId })
      .where(and(eq(projectUploadFiles.userId, userId), inArray(projectUploadFiles.key, keys)));
  }
}
