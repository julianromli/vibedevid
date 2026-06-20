import { createFileRoute } from "@tanstack/react-router";

/**
 * Lazily load the Uploadthing route handlers. The `uploadthing/server` import
 * (and its transitive `react-dom/server` dependency) must never reach the
 * client bundle. Because this route module is referenced by the generated
 * route tree on both the server and the client, the server-only imports are
 * deferred into the handlers so the module's top level stays client-safe.
 */
async function getUploadthingHandlers() {
  const { getServerRuntimeSecrets } = await import("@/lib/server/runtime-secrets");
  const uploadthingToken = getServerRuntimeSecrets().uploadthingToken?.trim();
  if (!uploadthingToken) {
    return null;
  }

  const [{ createRouteHandler }, { ourFileRouter }] = await Promise.all([
    import("uploadthing/server"),
    import("@/lib/uploadthing"),
  ]);

  return createRouteHandler({
    router: ourFileRouter,
    config: {
      token: uploadthingToken,
    },
  });
}

export const Route = createFileRoute("/api/uploadthing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = await getUploadthingHandlers();
        if (!handlers) {
          return Response.json({ error: "Upload service not configured" }, { status: 503 });
        }
        return handlers(request);
      },
      POST: async ({ request }) => {
        const handlers = await getUploadthingHandlers();
        if (!handlers) {
          return Response.json({ error: "Upload service not configured" }, { status: 503 });
        }
        return handlers(request);
      },
    },
  },
});
