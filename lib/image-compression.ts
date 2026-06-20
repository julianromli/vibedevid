/**
 * Client-side image compression for uploads.
 *
 * Cloudflare Workers cannot run `sharp` (a native binary) and UploadThing uses
 * client-side uploads (the browser sends the file straight to `ufs.sh`), so the
 * only place we can shrink images without a paid image CDN is the browser, before
 * the upload starts. We downscale to a sensible max dimension and re-encode as
 * WebP, which typically cuts a 380KB PNG/JPEG to ~80-120KB while staying sharp
 * enough for both project cards and detail pages.
 *
 * Wire this into UploadThing via the `onBeforeUploadBegin` callback.
 */

export interface CompressImageOptions {
  /** Longest-edge cap in pixels. Images larger than this are downscaled. */
  maxDimension?: number;
  /** WebP quality, 0-1. */
  quality?: number;
  /** Skip files already smaller than this (bytes) — not worth re-encoding. */
  skipBelowBytes?: number;
}

const DEFAULTS: Required<CompressImageOptions> = {
  // 1600px keeps detail pages crisp while still being far smaller than typical
  // 2-4MB source uploads.
  maxDimension: 1600,
  quality: 0.8,
  // Files under ~60KB are already small; re-encoding risks making them larger.
  skipBelowBytes: 60 * 1024,
};

function isCompressibleImage(file: File): boolean {
  // GIFs would lose animation; SVGs are vector. Only raster JPEG/PNG/WebP benefit.
  return /^image\/(jpe?g|png|webp)$/i.test(file.type);
}

function computeTargetSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // Fallback for browsers without createImageBitmap.
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

function renameToWebp(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".webp";
}

/**
 * Compress a single image file. Returns the original file unchanged if the file
 * is not a compressible raster image, is already small, the browser lacks the
 * needed APIs, or compression fails / does not actually reduce size.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  if (typeof document === "undefined") return file; // SSR guard
  if (!isCompressibleImage(file)) return file;
  if (file.size <= opts.skipBelowBytes) return file;

  try {
    const bitmap = await decodeImage(file);
    const srcWidth = "width" in bitmap ? bitmap.width : 0;
    const srcHeight = "height" in bitmap ? bitmap.height : 0;
    if (!srcWidth || !srcHeight) {
      if ("close" in bitmap) bitmap.close();
      return file;
    }

    const { width, height } = computeTargetSize(srcWidth, srcHeight, opts.maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if ("close" in bitmap) bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", opts.quality);
    });

    // If encoding failed or the result is not actually smaller, keep the original.
    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], renameToWebp(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    // Any failure: fall back to the original file so uploads never break.
    return file;
  }
}

/**
 * Compress a list of files. Suitable as an UploadThing `onBeforeUploadBegin`
 * handler: `onBeforeUploadBegin={compressImageFiles}`.
 */
export async function compressImageFiles(
  files: File[],
  options: CompressImageOptions = {},
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImageFile(file, options)));
}
