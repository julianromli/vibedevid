/**
 * Cropped avatars go out as JPEG, at most 1024px on the long edge. A full-size
 * PNG crop of a phone photo is easily over the 2MB avatar limit.
 */
export const AVATAR_OUTPUT_TYPE = "image/jpeg";
export const AVATAR_OUTPUT_QUALITY = 0.9;
export const AVATAR_OUTPUT_MAX_EDGE = 1024;

/** Scale `width` x `height` down so neither side is over `maxEdge`. Never scales up. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** The source name with a `.jpg` extension, since the crop is always JPEG. */
export function avatarFileName(sourceName: string | undefined): string {
  const base = sourceName?.replace(/\.[^.]+$/, "").trim();
  return `${base || "avatar"}.jpg`;
}
