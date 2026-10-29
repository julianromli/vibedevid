import { isR2ProjectKey } from "@/lib/r2-project-uploads";
import type { ProjectUploadBucket } from "@/lib/server/project-image-upload";

export interface UploadCleanupResult {
  success: boolean;
  deletedCount: number;
}

type R2Bucket = ProjectUploadBucket & { delete(keys: string | string[]): Promise<unknown> };

/** The `PROJECT_UPLOADS` R2 binding from wrangler.jsonc, or null outside Workers. */
export function getProjectUploadsBucket(): R2Bucket | null {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const bucket = env?.PROJECT_UPLOADS as R2Bucket | undefined;
  return bucket && typeof bucket.put === "function" ? bucket : null;
}

/**
 * Delete project screenshots wherever they live. New uploads are R2 keys
 * (`projects/...`); older ones are UploadThing keys.
 */
export async function deleteStoredProjectFiles(
  fileKeys: string | string[],
): Promise<UploadCleanupResult> {
  const keys = (Array.isArray(fileKeys) ? fileKeys : [fileKeys])
    .map((key) => key.trim())
    .filter(Boolean);
  const r2Keys = keys.filter(isR2ProjectKey);
  const utKeys = keys.filter((key) => !isR2ProjectKey(key));

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
