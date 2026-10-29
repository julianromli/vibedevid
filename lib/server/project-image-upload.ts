import { sniffImageMime } from "@/lib/image-sniff";
import { projectUploadKey, r2PublicUrl } from "@/lib/r2-project-uploads";

/** Same limit the UploadThing route had. The client compresses before upload. */
export const PROJECT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const CLAIMED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** The part of an R2 bucket binding this handler uses. */
export interface ProjectUploadBucket {
  put(
    key: string,
    value: Uint8Array,
    options: { httpMetadata: { contentType: string; cacheControl: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
}

export interface ProjectImageUploadDeps {
  requireUserId: () => Promise<string>;
  bucket: ProjectUploadBucket;
  record: (input: { key: string; url: string; userId: string }) => Promise<void>;
  newId: () => string;
}

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

/**
 * One screenshot per request, sent as the raw request body. The server checks
 * the session, the size, and the image bytes, picks the key, stores the file,
 * and writes the ledger row. No callback from a third party is needed.
 */
export async function handleProjectImageUpload(
  request: Request,
  deps: ProjectImageUploadDeps,
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return error(403, "Forbidden");
  }

  let userId: string;
  try {
    userId = await deps.requireUserId();
  } catch {
    return error(401, "You must be signed in to upload screenshots");
  }

  const claimed = (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  if (!claimed || !CLAIMED_TYPES.has(claimed)) {
    return error(415, "Only JPG, PNG, and WebP images are allowed");
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > PROJECT_IMAGE_MAX_BYTES) {
    return error(413, "Screenshots must be 4MB or smaller");
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) {
    return error(400, "The file is empty");
  }
  if (bytes.byteLength > PROJECT_IMAGE_MAX_BYTES) {
    return error(413, "Screenshots must be 4MB or smaller");
  }

  const mime = sniffImageMime(bytes);
  if (!mime) {
    return error(415, "Only JPG, PNG, and WebP images are allowed");
  }

  const key = projectUploadKey(userId, deps.newId(), mime);
  const url = r2PublicUrl(key);

  await deps.bucket.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: "public, max-age=31536000, immutable" },
  });

  try {
    await deps.record({ key, url, userId });
  } catch {
    // No ledger row means submit would reject the file: do not leave it behind.
    await deps.bucket.delete(key).catch(() => undefined);
    return error(500, "The screenshot could not be saved");
  }

  return Response.json({ key, url });
}
