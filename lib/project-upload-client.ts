import { compressForUpload } from "@/lib/image-compression";
import { postImageFile, type UploadImageOptions } from "@/lib/image-upload-client";
import type { ProjectUploadResult } from "@/lib/project-upload-result";

export const PROJECT_IMAGE_UPLOAD_URL = "/api/project-uploads/image";

/**
 * Send one screenshot to our server, which stores it in R2 and records it in
 * the upload ledger. Rejects on network errors and on any non-2xx response.
 * The file goes as-is: callers compress it first (the submit form does so when
 * files are picked, so its size check sees the compressed file).
 */
export async function uploadProjectImage(
  file: File,
  options: UploadImageOptions = {},
): Promise<ProjectUploadResult> {
  const data = (await postImageFile(PROJECT_IMAGE_UPLOAD_URL, file, options)) as {
    key?: unknown;
    url?: unknown;
  } | null;
  if (typeof data?.key !== "string" || typeof data.url !== "string") return null;
  return { key: data.key, url: data.url };
}

/** Compress and upload several screenshots one by one; failed files are skipped. */
export async function uploadProjectImages(files: File[]): Promise<ProjectUploadResult[]> {
  const results: ProjectUploadResult[] = [];
  for (const file of files) {
    const upload = await compressForUpload(file, "projects");
    results.push(await uploadProjectImage(upload).catch(() => null));
  }
  return results;
}
