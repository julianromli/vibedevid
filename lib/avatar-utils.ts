/**
 * Avatar utilities — UploadThing storage cleanup
 */

import { deleteUploadthingFiles } from "@/lib/uploadthing";

const UPLOADTHING_HOST = "utfs.io";

export function extractUploadthingKeyFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(UPLOADTHING_HOST)) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

export async function deleteAvatarFile(url: string): Promise<boolean> {
  const key = extractUploadthingKeyFromUrl(url);
  if (!key) return false;
  const result = await deleteUploadthingFiles(key);
  return result.success;
}

export function scheduleOldAvatarDeletion(oldAvatarUrl: string, delayMs = 10_000): void {
  const key = extractUploadthingKeyFromUrl(oldAvatarUrl);
  if (!key) return;

  setTimeout(() => {
    void deleteAvatarFile(oldAvatarUrl);
  }, delayMs);
}

export function isOurStorageUrl(url: string): boolean {
  return extractUploadthingKeyFromUrl(url) !== null;
}

/** @deprecated Use extractUploadthingKeyFromUrl */
export const extractStoragePathFromUrl = extractUploadthingKeyFromUrl;

/** @deprecated Use deleteAvatarFile */
export const deleteStorageFile = deleteAvatarFile;
