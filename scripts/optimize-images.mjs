/**
 * Build-time responsive image optimizer.
 *
 * Generates AVIF + WebP variants of large public images at several widths into
 * `public/optimized/`. The hero image is the LCP element, so shrinking it from a
 * 2880x1800 / ~660KB PNG to right-sized AVIF/WebP is the single biggest win for
 * Lighthouse LCP.
 *
 * Run manually with `node scripts/optimize-images.mjs`, or it runs automatically
 * before `vp build` via the `build` npm script. Output is idempotent: variants
 * are only regenerated when the source file is newer than the generated file.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = "public";
const OUT_DIR = join(PUBLIC_DIR, "optimized");

/**
 * Images to optimize. `widths` are the rendered breakpoints we want to cover.
 * Keep widths <= the source intrinsic width to avoid upscaling.
 */
const TARGETS = [
  { file: "hero-vibedevid-showcase.png", widths: [640, 960, 1200, 1600, 2400] },
  { file: "modern-tech-workspace.png", widths: [640, 1024] },
  { file: "professional-woman-dark-hair.png", widths: [128, 256, 512] },
  { file: "blonde-woman-glasses.png", widths: [128, 256, 512] },
  { file: "asian-man-short-hair.png", widths: [128, 256, 512] },
  { file: "hispanic-man-beard.png", widths: [128, 256, 512] },
];

const FORMATS = [
  { ext: "avif", options: { quality: 55, effort: 4 } },
  { ext: "webp", options: { quality: 72, effort: 4 } },
];

/** Return true when `out` is missing or older than `src`. */
async function needsRebuild(src, out) {
  if (!existsSync(out)) return true;
  const [s, o] = await Promise.all([stat(src), stat(out)]);
  return s.mtimeMs > o.mtimeMs;
}

function variantName(file, width, ext) {
  const base = basename(file, extname(file));
  return `${base}-${width}.${ext}`;
}

async function processTarget(target) {
  const srcPath = join(PUBLIC_DIR, target.file);
  if (!existsSync(srcPath)) {
    console.warn(`[optimize-images] skip (missing): ${target.file}`);
    return [];
  }

  const input = await readFile(srcPath);
  const meta = await sharp(input).metadata();
  const intrinsicWidth = meta.width ?? Math.max(...target.widths);

  const generated = [];

  for (const width of target.widths) {
    const targetWidth = Math.min(width, intrinsicWidth);

    for (const format of FORMATS) {
      const outName = variantName(target.file, width, format.ext);
      const outPath = join(OUT_DIR, outName);

      if (!(await needsRebuild(srcPath, outPath))) {
        generated.push({ outName, skipped: true });
        continue;
      }

      const pipeline = sharp(input).resize({ width: targetWidth, withoutEnlargement: true });
      const buffer =
        format.ext === "avif"
          ? await pipeline.avif(format.options).toBuffer()
          : await pipeline.webp(format.options).toBuffer();

      await writeFile(outPath, buffer);
      generated.push({ outName, bytes: buffer.length, skipped: false });
    }
  }

  return generated;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let built = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const target of TARGETS) {
    const results = await processTarget(target);
    for (const r of results) {
      if (r.skipped) {
        skipped += 1;
      } else {
        built += 1;
        totalBytes += r.bytes ?? 0;
      }
    }
  }

  // Write a manifest so callers can do integrity checks if needed later.
  const manifest = TARGETS.map((t) => ({
    file: t.file,
    widths: t.widths,
    variants: t.widths.flatMap((w) => FORMATS.map((f) => variantName(t.file, w, f.ext))),
  }));
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestPath = join(OUT_DIR, "manifest.json");
  const manifestHash = createHash("sha1").update(manifestJson).digest("hex").slice(0, 8);
  await writeFile(manifestPath, manifestJson);

  console.log(
    `[optimize-images] built ${built}, skipped ${skipped}, ` +
      `${(totalBytes / 1024).toFixed(0)}KB written (manifest ${manifestHash})`,
  );
}

main().catch((err) => {
  console.error("[optimize-images] failed:", err);
  process.exitCode = 1;
});
