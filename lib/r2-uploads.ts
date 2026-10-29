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

/** Top-level folders in the bucket, one per kind of upload. */
export const R2_UPLOAD_KINDS = ["projects", "events", "blog", "avatars", "testimonials"] as const;
export type R2UploadKind = (typeof R2_UPLOAD_KINDS)[number];

/** Kinds a signed-in user uploads through `/api/uploads/image?kind=`. */
export const IMAGE_UPLOAD_KIND_NAMES = ["events", "blog", "avatars"] as const;
export type ImageUploadKind = (typeof IMAGE_UPLOAD_KIND_NAMES)[number];

// <kind>/<ownerId>/<id>.<ext>. No dots or slashes in the parts, so no "..".
const R2_UPLOAD_KEY = new RegExp(
  `^(?:${R2_UPLOAD_KINDS.join("|")})/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\\.(?:jpg|png|webp)$`,
);

export function r2UploadKey(
  kind: R2UploadKind,
  ownerId: string,
  id: string,
  mime: SniffedImageMime,
): string {
  return `${kind}/${ownerId}/${id}${SNIFFED_IMAGE_EXTENSION[mime]}`;
}

/** True for any key this app wrote to R2, whatever the kind. UploadThing keys have no slash. */
export function isR2UploadKey(key: string): boolean {
  return R2_UPLOAD_KEY.test(key);
}

/** True for project screenshot keys this app wrote to R2. */
export function isR2ProjectKey(key: string): boolean {
  return isR2UploadKey(key) && key.startsWith("projects/");
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
