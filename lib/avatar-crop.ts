import { UPLOAD_MAX_EDGE, UPLOAD_WEBP_QUALITY } from "@/lib/image-compression";

/**
 * Cropped avatars go out as WebP, at most 512px on the long edge. A full-size
 * PNG crop of a phone photo is easily over the 2MB avatar limit.
 */
export const AVATAR_OUTPUT_TYPE = "image/webp";
export const AVATAR_OUTPUT_QUALITY = UPLOAD_WEBP_QUALITY;
export const AVATAR_OUTPUT_MAX_EDGE = UPLOAD_MAX_EDGE.avatars;

/**
 * The source name with the extension of what the browser actually encoded.
 * Browsers without a WebP encoder return PNG from `toBlob("image/webp")`.
 */
export function avatarFileName(sourceName: string | undefined, encodedType: string): string {
  const base = sourceName?.replace(/\.[^.]+$/, "").trim() || "avatar";
  const extension =
    encodedType === "image/webp" ? "webp" : encodedType === "image/jpeg" ? "jpg" : "png";
  return `${base}.${extension}`;
}
