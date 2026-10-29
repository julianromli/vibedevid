import { postImageFile, type UploadImageOptions } from "@/lib/image-upload-client";
import type { ProjectUploadResult } from "@/lib/project-upload-result";

export const PROJECT_IMAGE_UPLOAD_URL = "/api/project-uploads/image";

/**
 * Send one screenshot to our server, which stores it in R2 and records it in
 * the upload ledger. Rejects on network errors and on any non-2xx response.
 */
export async function uploadProjectImage(
  file: File,
  options: UploadImageOptions = {},
): Promise<ProjectUploadResult> {
  const serverData = await postImageFile(PROJECT_IMAGE_UPLOAD_URL, file, options);
  return { serverData: (serverData ?? null) as ProjectUploadResult["serverData"] };
}

/** Upload several screenshots one by one; failed files are skipped. */
export async function uploadProjectImages(files: File[]): Promise<ProjectUploadResult[]> {
  const results: ProjectUploadResult[] = [];
  for (const file of files) {
    results.push(await uploadProjectImage(file).catch(() => ({ serverData: null })));
  }
  return results;
}
