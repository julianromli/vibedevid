import { isR2UrlForKey } from "@/lib/r2-project-uploads";

/**
 * What the browser gets back for one project screenshot. `serverData` is what
 * `/api/project-uploads` returned after it stored the file and wrote the
 * ledger row. It is missing when the upload failed.
 */
export interface ProjectUploadResult {
  serverData?: { key?: string; url?: string } | null;
}

/** The URL and key the server recorded, or null when the server never confirmed the file. */
export function getConfirmedUpload(
  result: ProjectUploadResult | undefined,
): { url: string; key: string } | null {
  const url = result?.serverData?.url?.trim();
  const key = result?.serverData?.key?.trim();
  if (!url || !key || !isR2UrlForKey(url, key)) return null;
  return { url, key };
}

export const UNCONFIRMED_UPLOAD_MESSAGE =
  "A screenshot could not be saved. Use a JPG, PNG, or WebP image under 4MB and try again.";
