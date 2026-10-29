import { type SniffedImageMime, sniffImageMime } from "@/lib/image-sniff";
import {
  type ImageUploadKind,
  type R2UploadKind,
  r2PublicUrl,
  r2UploadKey,
  UPLOAD_MAX_BYTES,
} from "@/lib/r2-uploads";

const CLAIMED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** The part of an R2 bucket binding the upload code uses. */
export interface ImageUploadBucket {
  put(
    key: string,
    value: Uint8Array,
    options: { httpMetadata: { contentType: string; cacheControl: string } },
  ): Promise<unknown>;
  delete(keys: string | string[]): Promise<unknown>;
}

export interface ImageUploadDeps {
  /** The signed-in user's id, or null when signed out. Throws only when the lookup fails. */
  getUserId: () => Promise<string | null>;
  /** Why this account may not upload (e.g. suspended), or null. */
  blockReason?: (userId: string) => Promise<string | null>;
  bucket: ImageUploadBucket;
  newId: () => string;
}

export interface ImageUploadOptions {
  kind: R2UploadKind;
  maxBytes: number;
  /** Shown when the file is over `maxBytes`. */
  tooLarge: string;
  /** Shown to signed-out users. */
  signedOut: string;
  /** Runs after the object is stored. If it throws, the object is deleted. */
  afterStore?: (stored: StoredImage & { userId: string }) => Promise<void>;
  /** Shown when `afterStore` fails. */
  saveFailed?: string;
}

export interface StoredImage {
  key: string;
  url: string;
}

/**
 * Kinds a signed-in user can upload through `/api/uploads/image?kind=`.
 * Limits match the old UploadThing routes. Project screenshots have their own
 * route (it writes a ledger row) and testimonial avatars are stored server-side.
 */
export const IMAGE_UPLOAD_KINDS = {
  events: { maxBytes: UPLOAD_MAX_BYTES.events, tooLarge: "Cover images must be 4MB or smaller" },
  blog: { maxBytes: UPLOAD_MAX_BYTES.blog, tooLarge: "Images must be 4MB or smaller" },
  avatars: { maxBytes: UPLOAD_MAX_BYTES.avatars, tooLarge: "Avatars must be 2MB or smaller" },
} as const satisfies Record<ImageUploadKind, { maxBytes: number; tooLarge: string }>;

export function isImageUploadKind(value: unknown): value is ImageUploadKind {
  return typeof value === "string" && Object.hasOwn(IMAGE_UPLOAD_KINDS, value);
}

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

async function putImage(
  bucket: ImageUploadBucket,
  key: string,
  bytes: Uint8Array,
  mime: SniffedImageMime,
): Promise<void> {
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: CACHE_CONTROL },
  });
}

/**
 * The uploader's user id, or the response to send instead: 401 signed out,
 * 403 blocked (e.g. suspended), 500 when the lookup itself fails.
 */
async function resolveUploader(
  deps: ImageUploadDeps,
  signedOut: string,
): Promise<string | Response> {
  try {
    const userId = await deps.getUserId();
    if (!userId) return error(401, signedOut);
    const blocked = deps.blockReason ? await deps.blockReason(userId) : null;
    return blocked ? error(403, blocked) : userId;
  } catch (lookupError) {
    console.error("[image-upload] session lookup failed:", lookupError);
    return error(500, "Could not check your session. Please try again.");
  }
}

/**
 * One image per request, sent as the raw request body. The server checks the
 * origin, the session, the claimed type, the size, and the image bytes, picks
 * the key, and stores the file in R2. No third-party callback is involved.
 */
export async function handleImageUpload(
  request: Request,
  deps: ImageUploadDeps,
  options: ImageUploadOptions,
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return error(403, "Forbidden");
  }

  const uploader = await resolveUploader(deps, options.signedOut);
  if (uploader instanceof Response) return uploader;
  const userId = uploader;

  const claimed = (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  if (!claimed || !CLAIMED_TYPES.has(claimed)) {
    return error(415, "Only JPG, PNG, and WebP images are allowed");
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > options.maxBytes) {
    return error(413, options.tooLarge);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) {
    return error(400, "The file is empty");
  }
  if (bytes.byteLength > options.maxBytes) {
    return error(413, options.tooLarge);
  }

  const mime = sniffImageMime(bytes);
  if (!mime) {
    return error(415, "Only JPG, PNG, and WebP images are allowed");
  }

  const key = r2UploadKey(options.kind, userId, deps.newId(), mime);
  const url = r2PublicUrl(key);
  await putImage(deps.bucket, key, bytes, mime);

  if (options.afterStore) {
    try {
      await options.afterStore({ key, url, userId });
    } catch (afterStoreError) {
      console.error(`[image-upload] afterStore failed for ${key}:`, afterStoreError);
      await deps.bucket.delete(key).catch((deleteError: unknown) => {
        console.error(`[image-upload] rollback delete failed for ${key}:`, deleteError);
      });
      return error(500, options.saveFailed ?? "The image could not be saved");
    }
  }

  return Response.json({ key, url });
}

/** `/api/uploads/image?kind=events|blog|avatars`. */
export function handleKindImageUpload(request: Request, deps: ImageUploadDeps): Promise<Response> {
  const kind = new URL(request.url).searchParams.get("kind");
  if (!isImageUploadKind(kind)) {
    return Promise.resolve(error(400, "Unknown upload kind"));
  }
  const { maxBytes, tooLarge } = IMAGE_UPLOAD_KINDS[kind];
  return handleImageUpload(request, deps, {
    kind,
    maxBytes,
    tooLarge,
    signedOut: "You must be signed in to upload images",
  });
}

/**
 * Store bytes the server already holds (no request to check), e.g. an
 * anonymous testimonial avatar. Throws with a user-facing message.
 */
export async function storeImageBytes(
  bytes: Uint8Array,
  options: {
    bucket: ImageUploadBucket;
    kind: R2UploadKind;
    ownerId: string;
    id: string;
    maxBytes: number;
    tooLarge?: string;
  },
): Promise<StoredImage> {
  if (bytes.byteLength > options.maxBytes) {
    throw new Error(options.tooLarge ?? "The image is too large");
  }
  const mime = sniffImageMime(bytes);
  if (!mime) {
    throw new Error("Only JPG, PNG, and WebP images are allowed");
  }
  const key = r2UploadKey(options.kind, options.ownerId, options.id, mime);
  await putImage(options.bucket, key, bytes, mime);
  return { key, url: r2PublicUrl(key) };
}
