/**
 * Client-side WebP compression for every upload.
 *
 * Workers cannot run `sharp` and the R2 public bucket does no resizing, so the
 * browser shrinks images before they leave: decode, scale the long edge down to
 * the kind's cap, and re-encode as WebP. A phone photo of a few MB usually ends
 * up a few hundred KB.
 *
 * Whatever goes wrong, the original file is uploaded instead: no WebP encoder,
 * a WebP that is not smaller, an animated image, or a decode failure. The
 * server still accepts JPEG, PNG and WebP and stores the type it sniffs.
 */
import { type R2UploadKind, UPLOAD_MAX_BYTES } from "@/lib/r2-uploads";

export const UPLOAD_WEBP_QUALITY = 0.82;

/** Longest edge, in pixels, an upload of each kind is scaled down to. */
export const UPLOAD_MAX_EDGE: Record<R2UploadKind, number> = {
  avatars: 512,
  testimonials: 512,
  blog: 1920,
  events: 1920,
  projects: 1920,
};

const COMPRESSIBLE_TYPE = /^image\/(jpe?g|png|webp)$/i;

/** Enough of the file to find the animation markers, which sit before the image data. */
const SNIFF_BYTES = 64 * 1024;

/** Scale `width` x `height` down so neither side is over `maxEdge`. Never scales up. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function webpFileName(name: string): string {
  return `${name.replace(/\.[^.]*$/, "").trim() || "image"}.webp`;
}

/**
 * A WebP that already fits (edge and bytes) is left alone: it was compressed
 * already (the avatar crop, or a screenshot compressed when picked), and
 * re-encoding lossy WebP only loses quality. One over the byte limit is
 * re-encoded, since the server would refuse it anyway.
 */
export function needsReencode(
  file: { type: string; size: number },
  width: number,
  height: number,
  kind: R2UploadKind,
) {
  return (
    file.type.toLowerCase() !== "image/webp" ||
    Math.max(width, height) > UPLOAD_MAX_EDGE[kind] ||
    file.size > UPLOAD_MAX_BYTES[kind]
  );
}

/** The WebP when the browser really made one and it is smaller; otherwise the original. */
export function keepSmallerUpload(original: File, encoded: Blob | null): File {
  if (!encoded || encoded.type !== "image/webp" || encoded.size >= original.size) {
    return original;
  }
  return new File([encoded], webpFileName(original.name), {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

const ascii = (bytes: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...bytes.subarray(at, at + length));

/**
 * GIFs, APNGs (`acTL` before `IDAT`) and animated WebPs (VP8X animation flag).
 * Canvas keeps only frame one. A PNG whose prefix ends before `IDAT` counts as
 * animated, so an unknown case keeps the original.
 */
export function isAnimatedImage(bytes: Uint8Array): boolean {
  if (ascii(bytes, 0, 3) === "GIF") return true;

  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let at = 8; at + 8 <= bytes.length; ) {
      const type = ascii(bytes, at + 4, 4);
      if (type === "acTL") return true;
      if (type === "IDAT") return false;
      at += 12 + view.getUint32(at);
    }
    return true;
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return ascii(bytes, 12, 4) === "VP8X" && ((bytes[20] ?? 0) & 0x02) !== 0;
  }

  return false;
}

/** Shrink one image for an upload of `kind`. Never throws; falls back to `file`. */
export async function compressForUpload(file: File, kind: R2UploadKind): Promise<File> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return file;
  if (!COMPRESSIBLE_TYPE.test(file.type)) return file;

  try {
    const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
    if (isAnimatedImage(head)) return file;

    const bitmap = await createImageBitmap(file);
    const maxEdge = UPLOAD_MAX_EDGE[kind];
    try {
      if (!bitmap.width || !bitmap.height) return file;
      if (!needsReencode(file, bitmap.width, bitmap.height, kind)) return file;

      const size = fitWithin(bitmap.width, bitmap.height, maxEdge);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);

      const encoded = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", UPLOAD_WEBP_QUALITY);
      });
      return keepSmallerUpload(file, encoded);
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}
