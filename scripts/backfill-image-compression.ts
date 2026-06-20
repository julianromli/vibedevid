/**
 * One-off backfill: recompress oversized project/video images already stored in
 * UploadThing.
 *
 * The client-side compressor (`lib/image-compression.ts`) only shrinks NEW
 * uploads. Images uploaded before that change are still large (e.g. the ~380KB
 * thumbnail flagged by Lighthouse `image-delivery-insight`). This script fixes
 * existing data: it downloads each image, recompresses it to WebP with sharp,
 * re-uploads the smaller file to UploadThing, points the DB row at the new URL,
 * and deletes the old UploadThing file.
 *
 * Runs on Node/Bun (NOT Cloudflare Workers) because it uses `sharp`.
 *
 * Usage:
 *   bun run scripts/backfill-image-compression.ts            # dry run (no writes)
 *   bun run scripts/backfill-image-compression.ts --apply    # perform changes
 *   bun run scripts/backfill-image-compression.ts --apply --min-kb=80
 *
 * Env (from .env.local): DATABASE_URL, UPLOADTHING_TOKEN
 */

import { UTApi } from "uploadthing/server";
import postgres from "postgres";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const MIN_KB = Number(
  (process.argv.find((a) => a.startsWith("--min-kb=")) ?? "--min-kb=60").split("=")[1],
);
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

const DATABASE_URL = process.env.DATABASE_URL;
const UPLOADTHING_TOKEN = process.env.UPLOADTHING_TOKEN;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}
if (!UPLOADTHING_TOKEN) {
  console.error("UPLOADTHING_TOKEN is not set (check .env.local).");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);
const utapi = new UTApi({ token: UPLOADTHING_TOKEN });

const UFS_HOST_RE = /^https?:\/\/[a-z0-9]+\.ufs\.sh\/f\/([^/?#]+)/i;

/** Extract the UploadThing file key from a ufs.sh URL, or null if not one. */
function ufsKey(url: string): string | null {
  const m = url.match(UFS_HOST_RE);
  return m ? m[1] : null;
}

interface Candidate {
  table: "projects" | "vibe_videos";
  column: string;
  id: string | number;
  url: string;
  /** For array columns, the index within the array being replaced. */
  arrayIndex?: number;
  /** The full original array (for array columns). */
  arrayValue?: string[];
}

async function collectCandidates(): Promise<Candidate[]> {
  const out: Candidate[] = [];

  // projects.image_url (scalar)
  const projScalar = await sql<{ id: number; image_url: string | null }[]>`
    SELECT id, image_url FROM projects WHERE image_url IS NOT NULL
  `;
  for (const row of projScalar) {
    if (row.image_url && ufsKey(row.image_url)) {
      out.push({ table: "projects", column: "image_url", id: row.id, url: row.image_url });
    }
  }

  // projects.image_urls (text[])
  const projArray = await sql<{ id: number; image_urls: string[] | null }[]>`
    SELECT id, image_urls FROM projects WHERE image_urls IS NOT NULL
  `;
  for (const row of projArray) {
    const arr = row.image_urls ?? [];
    arr.forEach((url, idx) => {
      if (url && ufsKey(url)) {
        out.push({
          table: "projects",
          column: "image_urls",
          id: row.id,
          url,
          arrayIndex: idx,
          arrayValue: arr,
        });
      }
    });
  }

  // vibe_videos.thumbnail (scalar)
  const videos = await sql<{ id: string; thumbnail: string }[]>`
    SELECT id, thumbnail FROM vibe_videos WHERE thumbnail IS NOT NULL
  `;
  for (const row of videos) {
    if (row.thumbnail && ufsKey(row.thumbnail)) {
      out.push({ table: "vibe_videos", column: "thumbnail", id: row.id, url: row.thumbnail });
    }
  }

  return out;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function recompress(input: Buffer): Promise<Buffer | null> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) return null;
  const longest = Math.max(meta.width, meta.height);
  const pipeline = sharp(input).rotate();
  if (longest > MAX_DIMENSION) {
    pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside" });
  }
  return pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
}

async function main() {
  console.log(
    `[backfill] mode=${APPLY ? "APPLY" : "dry-run"} min-kb=${MIN_KB} max-dim=${MAX_DIMENSION} q=${WEBP_QUALITY}`,
  );

  const candidates = await collectCandidates();
  console.log(`[backfill] found ${candidates.length} UploadThing image reference(s)`);

  let processed = 0;
  let savedBytes = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of candidates) {
    const key = ufsKey(c.url);
    if (!key) continue;

    try {
      const original = await downloadBuffer(c.url);
      if (original.byteLength < MIN_KB * 1024) {
        skipped += 1;
        continue;
      }

      const compressed = await recompress(original);
      if (!compressed || compressed.byteLength >= original.byteLength) {
        skipped += 1;
        continue;
      }

      const delta = original.byteLength - compressed.byteLength;
      console.log(
        `  ${c.table}#${c.id} ${c.column}${c.arrayIndex !== undefined ? `[${c.arrayIndex}]` : ""}: ` +
          `${(original.byteLength / 1024).toFixed(0)}KB -> ${(compressed.byteLength / 1024).toFixed(0)}KB`,
      );

      if (!APPLY) {
        processed += 1;
        savedBytes += delta;
        continue;
      }

      // Re-upload the compressed variant. Build a Blob from the bytes; the
      // project's DOM lib types `BlobPart` narrowly, so we go through an
      // ArrayBuffer which is always a valid BlobPart. This runs on Node/Bun.
      const fileName = `${key}.webp`;
      const arrayBuffer = compressed.buffer.slice(
        compressed.byteOffset,
        compressed.byteOffset + compressed.byteLength,
      ) as ArrayBuffer;
      const file = new File([arrayBuffer], fileName, { type: "image/webp" });
      const [result] = await utapi.uploadFiles([file]);
      if (!result || result.error || !result.data) {
        throw new Error(`upload failed: ${result?.error?.message ?? "unknown"}`);
      }
      const newUrl = result.data.ufsUrl;

      // Update the DB row.
      if (c.column === "image_url") {
        await sql`UPDATE projects SET image_url = ${newUrl} WHERE id = ${c.id}`;
      } else if (c.column === "thumbnail") {
        await sql`UPDATE vibe_videos SET thumbnail = ${newUrl} WHERE id = ${c.id}`;
      } else if (c.column === "image_urls" && c.arrayValue && c.arrayIndex !== undefined) {
        const updated = [...c.arrayValue];
        updated[c.arrayIndex] = newUrl;
        await sql`UPDATE projects SET image_urls = ${updated} WHERE id = ${c.id}`;
      }

      // Delete the old file (best-effort).
      try {
        await utapi.deleteFiles([key]);
      } catch (delErr) {
        console.warn(`    (warning) could not delete old file ${key}:`, delErr);
      }

      processed += 1;
      savedBytes += delta;
    } catch (err) {
      failed += 1;
      console.error(
        `  ${c.table}#${c.id} ${c.column}: FAILED -`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(
    `[backfill] done: processed=${processed} skipped=${skipped} failed=${failed} ` +
      `saved≈${(savedBytes / 1024 / 1024).toFixed(2)}MB${APPLY ? "" : " (dry run — no changes written)"}`,
  );

  await sql.end();
}

main().catch((err) => {
  console.error("[backfill] fatal:", err);
  process.exit(1);
});
