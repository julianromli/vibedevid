/**
 * What the browser gets back from UploadThing for one project screenshot.
 * `serverData` is what our `onUploadComplete` returned. It is missing when
 * that callback failed, so the file has no ownership row and submit would
 * reject it later.
 */
export interface ProjectUploadResult {
  serverData?: { key?: string; url?: string } | null;
  url?: string;
  key?: string;
}

/** The URL and key the server recorded, or null when the server never confirmed the file. */
export function getConfirmedUpload(
  result: ProjectUploadResult | undefined,
): { url: string; key: string } | null {
  const url = result?.serverData?.url?.trim();
  const key = result?.serverData?.key?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export const UNCONFIRMED_UPLOAD_MESSAGE =
  "A screenshot could not be saved. Use a JPG, PNG, or WebP image under 4MB and try again.";
