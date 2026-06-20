/**
 * OptimizedImage renders a `<picture>` element backed by build-time generated
 * AVIF/WebP variants in `public/optimized/` (see `scripts/optimize-images.mjs`).
 *
 * Unlike `ProgressiveImage` (which relies on an image CDN that is not configured
 * for local assets), this component points directly at pre-generated responsive
 * files, so the browser downloads a right-sized, modern-format image. The PNG
 * source is kept as the final `<img>` fallback for very old browsers.
 *
 * Use this for known, static public images (hero, reviews avatars). For dynamic
 * or remote (CDN) images, keep using ProgressiveImage.
 */

import { cn } from "@/lib/utils";

type ImageFormat = "avif" | "webp";

export interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet"
> {
  /** Public path of the original image, e.g. "/hero-vibedevid-showcase.png". */
  src: string;
  alt: string;
  /** Intrinsic width of the source (used for layout / aspect ratio). */
  width: number;
  /** Intrinsic height of the source (used for layout / aspect ratio). */
  height: number;
  /** Widths that were pre-generated for this image. Must match the build script. */
  variantWidths: number[];
  /** `sizes` attribute describing rendered width across breakpoints. */
  sizes?: string;
  /** Formats to emit, in source-order preference. Defaults to AVIF then WebP. */
  formats?: ImageFormat[];
  /** Set true for the LCP image: eager load + high fetch priority. */
  priority?: boolean;
}

function baseName(src: string): string {
  const file = src.split("/").pop() ?? src;
  return file.replace(/\.[^.]+$/, "");
}

function buildSrcSet(name: string, widths: number[], ext: ImageFormat): string {
  return widths.map((w) => `/optimized/${name}-${w}.${ext} ${w}w`).join(", ");
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  variantWidths,
  sizes = "100vw",
  formats = ["avif", "webp"],
  priority = false,
  className,
  loading,
  decoding,
  ...rest
}: OptimizedImageProps) {
  const name = baseName(src);
  const widths = [...variantWidths].sort((a, b) => a - b);
  // Largest generated variant is the best <img> fallback default.
  const fallbackWidth = widths[widths.length - 1];

  return (
    <picture>
      {formats.map((format) => (
        <source
          key={format}
          type={`image/${format}`}
          srcSet={buildSrcSet(name, widths, format)}
          sizes={sizes}
        />
      ))}
      {/** biome-ignore lint/a11y/useAltText: alt is forwarded explicitly below. */}
      <img
        src={`/optimized/${name}-${fallbackWidth}.webp`}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={cn("h-auto w-full", className)}
        loading={loading ?? (priority ? "eager" : "lazy")}
        decoding={decoding ?? "async"}
        fetchPriority={priority ? "high" : "auto"}
        {...rest}
      />
    </picture>
  );
}

export default OptimizedImage;
