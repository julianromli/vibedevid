/**
 * UploadThing files. App uploads go to R2 (see `lib/server/image-upload.ts`).
 * Deletes are routed by key shape: keys that are not R2 keys
 * (`<kind>/<owner>/<id>.<ext>`) are
 * UploadThing keys and are deleted here, so removing an old screenshot still
 * frees its storage. The one remaining UploadThing writer is the one-off
 * `scripts/backfill-image-compression.ts`.
 */
import { UTApi } from "uploadthing/server";
import { getServerRuntimeSecrets } from "@/lib/server/runtime-secrets";
import { isUploadthingTokenShape } from "@/lib/uploadthing-token";

let utapiInstance: UTApi | null = null;
let cachedUtApiToken: string | null = null;

function withoutCacheFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!init || !("cache" in init)) {
    return fetch(input, init);
  }
  const { cache: _cache, ...rest } = init;
  return fetch(input, rest);
}

function getUtApi() {
  const token = getServerRuntimeSecrets().uploadthingToken.trim();
  if (!token) {
    throw new Error("UPLOADTHING_TOKEN is not configured");
  }
  if (!isUploadthingTokenShape(token)) {
    throw new Error(
      "UPLOADTHING_TOKEN is invalid. Use the base64 token from the UploadThing dashboard.",
    );
  }

  if (!utapiInstance || cachedUtApiToken !== token) {
    utapiInstance = new UTApi({
      token,
      fetch: withoutCacheFetch,
    });
    cachedUtApiToken = token;
  }
  return utapiInstance;
}

export interface UploadCleanupResult {
  success: boolean;
  deletedCount: number;
}

export async function deleteUploadthingFiles(
  fileKeys: string | string[],
): Promise<UploadCleanupResult> {
  const normalizedKeys = (Array.isArray(fileKeys) ? fileKeys : [fileKeys])
    .map((key) => key.trim())
    .filter(Boolean);

  if (normalizedKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  // UTApi returns a class instance; server functions can only serialize plain objects.
  const result = await getUtApi().deleteFiles(normalizedKeys);
  return { success: Boolean(result.success), deletedCount: Number(result.deletedCount) || 0 };
}
