/**
 * Images stored in Cloudflare R2 (bucket `vibedevid-uploads`), served from the
 * bucket's custom domain. Pure, so client and server share it.
 *
 * Keys are `<kind>/<ownerId>/<id>.<ext>`. Project screenshots are the only kind
 * with a ledger (see `project_upload_files`), so project checks stay narrower.
 */
import { SNIFFED_IMAGE_EXTENSION, type SniffedImageMime } from "@/lib/image-sniff";

export const R2_PUBLIC_HOST = "cdn.vibedeveloper.id";
const R2_PUBLIC_ORIGIN = `https://${R2_PUBLIC_HOST}`;
// projects/<userId>/<id>.<ext>. No dots or slashes in the parts, so no "..".
const R2_PROJECT_KEY = /^projects\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/;
const R2_UPLOAD_KEY =
  /^(?:projects|events|blog|avatars|testimonials)\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/;

/** Top-level folders in the bucket, one per kind of upload. */
export type R2UploadKind = "projects" | "events" | "blog" | "avatars" | "testimonials";

export function r2UploadKey(
  kind: R2UploadKind,
  ownerId: string,
  id: string,
  mime: SniffedImageMime,
): string {
  return `${kind}/${ownerId}/${id}${SNIFFED_IMAGE_EXTENSION[mime]}`;
}

export function projectUploadKey(userId: string, id: string, mime: SniffedImageMime): string {
  return r2UploadKey("projects", userId, id, mime);
}

/** True for project screenshot keys this app wrote to R2. UploadThing keys have no slash. */
export function isR2ProjectKey(key: string): boolean {
  return R2_PROJECT_KEY.test(key);
}

/** True for any key this app wrote to R2, whatever the kind. */
export function isR2UploadKey(key: string): boolean {
  return R2_UPLOAD_KEY.test(key);
}

export function r2PublicUrl(key: string): string {
  return `${R2_PUBLIC_ORIGIN}/${key}`;
}

export function isR2Host(hostname: string): boolean {
  return hostname.toLowerCase() === R2_PUBLIC_HOST;
}

/** True when `url` is exactly the CDN URL for `key`. */
export function isR2UrlForKey(url: string, key: string): boolean {
  if (!isR2ProjectKey(key)) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      isR2Host(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      parsed.pathname === `/${key}`
    );
  } catch {
    return false;
  }
}
