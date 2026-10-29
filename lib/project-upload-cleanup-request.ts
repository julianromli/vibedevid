import { z } from "zod";
import { MAX_SCREENSHOTS } from "@/lib/project-screenshots";

const bodySchema = z.object({
  keys: z.array(z.string().trim().min(1).max(512)).min(1).max(MAX_SCREENSHOTS),
});

/**
 * Best-effort cleanup sent with `fetch(..., { keepalive: true })` when the submit
 * page is closed or reloaded. `cleanup` checks the session and key ownership.
 */
export async function handleUploadCleanupRequest(
  request: Request,
  cleanup: (key: string) => Promise<unknown>,
): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let keys: string[];
  try {
    keys = bodySchema.parse(await request.json()).keys;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  for (const key of new Set(keys)) {
    await cleanup(key).catch(() => undefined);
  }
  return Response.json({ ok: true });
}
