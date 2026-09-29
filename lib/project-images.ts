/**
 * Rules for project screenshot URLs and UploadThing keys.
 *
 * This module is pure (no database) so both the client schema and the server
 * actions can share it. The server passes the rows it loaded for the signed-in
 * user; this function decides which URLs and keys may be stored.
 */

const MAX_IMAGE_URL_LENGTH = 2048;
const GITHUB_PREVIEW_HOST = "opengraph.githubassets.com";

export const INVALID_PROJECT_IMAGE_MESSAGE =
  "One or more screenshots are not valid uploads for your account";

export interface KnownProjectUpload {
  key: string;
  url: string;
  userId: string;
  projectId: number | null;
}

export interface AlignProjectImagesInput {
  submittedUrls: string[];
  submittedKeys: string[];
  knownUploads: KnownProjectUpload[];
  actorUserId: string;
  /** Null while the project row does not exist yet. */
  projectId: number | null;
  existingUrls: string[];
  existingKeys: string[];
}

export type AlignProjectImagesResult =
  | { ok: true; imageUrls: string[]; imageKeys: string[] }
  | { ok: false; error: string };

function isUploadthingHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "utfs.io" || host.endsWith(".utfs.io") || host === "ufs.sh" || host.endsWith(".ufs.sh")
  );
}

export function isGithubPreviewImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.toLowerCase() === GITHUB_PREVIEW_HOST;
  } catch {
    return false;
  }
}

/** HTTPS UploadThing file URL, or a GitHub Open Graph preview. */
export function isAllowedProjectImageUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > MAX_IMAGE_URL_LENGTH) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    if (parsed.username || parsed.password) return false;
    return isUploadthingHost(parsed.hostname) || isGithubPreviewImageUrl(trimmed);
  } catch {
    return false;
  }
}

/**
 * Keep only screenshots the server can explain.
 *
 * A new UploadThing file must match a ledger row for this user. A key already
 * stored on this project may stay (rows created before the ledger). A GitHub
 * preview may be stored with no key. Any other URL or key is rejected, and
 * rejected keys are not returned.
 */
export function alignProjectImages(input: AlignProjectImagesInput): AlignProjectImagesResult {
  const submittedKeys = new Set(input.submittedKeys.map((key) => key.trim()).filter(Boolean));
  const imageUrls: string[] = [];
  const imageKeys: string[] = [];
  const seen = new Set<string>();

  for (const rawUrl of input.submittedUrls) {
    const url = rawUrl.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const upload = input.knownUploads.find(
      (row) =>
        row.url === url &&
        row.userId === input.actorUserId &&
        submittedKeys.has(row.key) &&
        (row.projectId == null || row.projectId === input.projectId),
    );
    if (upload) {
      imageUrls.push(upload.url);
      imageKeys.push(upload.key);
      continue;
    }

    const existingIndex = input.existingUrls.indexOf(url);
    if (existingIndex >= 0) {
      const existingKey = (input.existingKeys[existingIndex] ?? "").trim();
      if (existingKey) {
        if (!submittedKeys.has(existingKey)) {
          return { ok: false, error: INVALID_PROJECT_IMAGE_MESSAGE };
        }
        imageUrls.push(url);
        imageKeys.push(existingKey);
        continue;
      }
      imageUrls.push(url);
      continue;
    }

    if (isGithubPreviewImageUrl(url)) {
      imageUrls.push(url);
      continue;
    }

    return { ok: false, error: INVALID_PROJECT_IMAGE_MESSAGE };
  }

  if (imageUrls.length === 0) {
    return { ok: false, error: "At least one project screenshot is required" };
  }

  if (imageUrls.length > 10) {
    return { ok: false, error: "Maximum 10 images allowed" };
  }

  return { ok: true, imageUrls, imageKeys };
}
