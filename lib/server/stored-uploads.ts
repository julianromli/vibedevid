import { isR2UploadKey } from "@/lib/r2-uploads";
import {
  type ImageUploadBucket,
  type StoredImage,
  storeImageBytes,
} from "@/lib/server/image-upload";
import { TESTIMONIAL_AVATAR_MAX_BYTES } from "@/lib/testimonial-form-utils";

export interface UploadCleanupResult {
  success: boolean;
  deletedCount: number;
}

/** The `PROJECT_UPLOADS` R2 binding from wrangler.jsonc, or null outside Workers. */
export function getProjectUploadsBucket(): ImageUploadBucket | null {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const bucket = env?.PROJECT_UPLOADS as ImageUploadBucket | undefined;
  return bucket && typeof bucket.put === "function" ? bucket : null;
}

/**
 * Store a testimonial avatar (no signed-in user) in R2. Takes the bytes the
 * action already read and sniffed; the size cap is the form's own limit.
 */
export async function storeAnonymousAvatar(bytes: Uint8Array): Promise<StoredImage> {
  const bucket = getProjectUploadsBucket();
  if (!bucket) {
    throw new Error("Upload service not configured");
  }
  return storeImageBytes(bytes, {
    bucket,
    kind: "testimonials",
    ownerId: "anonymous",
    id: crypto.randomUUID(),
    maxBytes: TESTIMONIAL_AVATAR_MAX_BYTES,
  });
}

/**
 * Delete uploaded files wherever they live. Keys this app wrote to R2 go to the
 * bucket; anything else is a legacy UploadThing key.
 */
export async function deleteStoredFiles(fileKeys: string | string[]): Promise<UploadCleanupResult> {
  const keys = (Array.isArray(fileKeys) ? fileKeys : [fileKeys])
    .map((key) => key.trim())
    .filter(Boolean);
  const r2Keys = keys.filter(isR2UploadKey);
  const utKeys = keys.filter((key) => !isR2UploadKey(key));

  let success = true;
  let deletedCount = 0;

  if (r2Keys.length > 0) {
    const bucket = getProjectUploadsBucket();
    if (bucket) {
      try {
        await bucket.delete(r2Keys);
        deletedCount += r2Keys.length;
      } catch (error) {
        console.warn("[stored-uploads] R2 delete failed:", error);
        success = false;
      }
    } else {
      console.warn("[stored-uploads] R2 delete skipped: PROJECT_UPLOADS binding missing");
      success = false;
    }
  }

  if (utKeys.length > 0) {
    try {
      const { deleteUploadthingFiles } = await import("@/lib/uploadthing");
      const result = await deleteUploadthingFiles(utKeys);
      success &&= result.success;
      deletedCount += result.deletedCount;
    } catch (error) {
      console.warn("[stored-uploads] UploadThing delete failed:", error);
      success = false;
    }
  }

  return { success, deletedCount };
}

/**
 * Delete files, then drop their ledger rows. When any delete fails the rows
 * stay, so the files can still be found and removed later.
 */
export async function deleteStoredFilesThenForget(
  keys: string[],
  forget: (key: string) => Promise<unknown>,
): Promise<UploadCleanupResult> {
  const result = await deleteStoredFiles(keys);
  if (result.success) {
    for (const key of keys) {
      await forget(key);
    }
  } else {
    console.warn("[stored-uploads] Keeping ledger rows; some files were not deleted:", keys);
  }
  return result;
}
