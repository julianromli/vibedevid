import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";

type FetchLike = typeof globalThis.fetch;

const INGEST_PATHS = new Set(["/route-metadata", "/callback-result"]);
const MAX_LOGGED_BODY = 500;

function ingestPath(input: Parameters<FetchLike>[0]): string | null {
  try {
    const raw = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
    const url = new URL(raw);
    if (!url.hostname.endsWith(".uploadthing.com")) return null;
    return INGEST_PATHS.has(url.pathname) ? url.pathname : null;
  } catch {
    return null;
  }
}

/**
 * uploadthing 7.x treats a non-2xx `/route-metadata` response as success (it
 * only logs it at Debug) and then drops the daemon failure without logging.
 * When registration fails UploadThing never calls back, the client never gets
 * `serverData`, and production logs show nothing. This wrapper logs the status
 * and a truncated body for failed ingest calls. It never logs request headers
 * (they carry the API key).
 */
export function withUploadthingIngestDiagnostics(
  baseFetch: FetchLike,
  log: (message: string, details: Record<string, unknown>) => void = (message, details) =>
    // biome-ignore lint/suspicious/noConsole: intentional production diagnostic for UploadThing ingest failures
    console.error(message, details),
): FetchLike {
  return (async (input, init) => {
    const path = ingestPath(input);
    if (!path) return baseFetch(input, init);

    let response: Response;
    try {
      response = await baseFetch(input, init);
    } catch (error) {
      log("[uploadthing] ingest request failed", {
        path,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (!response.ok) {
      const body = await response
        .clone()
        .text()
        .catch(() => "");
      log("[uploadthing] ingest request rejected", {
        path,
        status: response.status,
        body: body.slice(0, MAX_LOGGED_BODY),
      });
    }
    return response;
  }) as FetchLike;
}

export function createUploadthingRouteHandler(
  token: string,
  baseFetch: FetchLike = globalThis.fetch,
) {
  return createRouteHandler({
    router: ourFileRouter,
    config: {
      token,
      fetch: withUploadthingIngestDiagnostics(baseFetch),
    },
  });
}
