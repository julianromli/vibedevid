import { readFileBytes } from "@/lib/image-sniff";
import { isR2UploadKey } from "@/lib/r2-project-uploads";
import {
  type ImageUploadBucket,
  type StoredImage,
  storeImageBytes,
} from "@/lib/server/image-upload";

export interface UploadCleanupResult {
  success: boolean;
  deletedCount: number;
}

type R2Bucket = ImageUploadBucket & { delete(keys: string | string[]): Promise<unknown> };

const ANONYMOUS_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** The `PROJECT_UPLOADS` R2 binding from wrangler.jsonc, or null outside Workers. */
export function getProjectUploadsBucket(): R2Bucket | null {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const bucket = env?.PROJECT_UPLOADS as R2Bucket | undefined;
  return bucket && typeof bucket.put === "function" ? bucket : null;
}

/** Store a testimonial avatar (no signed-in user) in R2. */
export async function storeAnonymousAvatar(file: File): Promise<StoredImage> {
  if (file.size > ANONYMOUS_AVATAR_MAX_BYTES) {
    throw new Error("Foto maksimal 2 MB");
  }
  const bucket = getProjectUploadsBucket();
  if (!bucket) {
    throw new Error("Upload service not configured");
  }
  return storeImageBytes(await readFileBytes(file), {
    bucket,
    kind: "testimonials",
    ownerId: "anonymous",
    id: crypto.randomUUID(),
    maxBytes: ANONYMOUS_AVATAR_MAX_BYTES,
    tooLarge: "Foto maksimal 2 MB",
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
      } catch {
        success = false;
      }
    } else {
      success = false;
    }
  }

  if (utKeys.length > 0) {
    try {
      const { deleteUploadthingFiles } = await import("@/lib/uploadthing");
      const result = await deleteUploadthingFiles(utKeys);
      success &&= result.success;
      deletedCount += result.deletedCount;
    } catch {
      success = false;
    }
  }

  return { success, deletedCount };
}
