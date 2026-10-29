import { createFileRoute } from "@tanstack/react-router";

/**
 * Event cover, blog, and avatar uploads to R2 (`?kind=events|blog|avatars`).
 * Server-only modules load inside the handler so this route module stays
 * client-safe in the generated route tree.
 */
export const Route = createFileRoute("/api/uploads/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ handleKindImageUpload }, { getProjectUploadsBucket }, auth] = await Promise.all([
          import("@/lib/server/image-upload"),
          import("@/lib/server/stored-uploads"),
          import("@/lib/server/auth"),
        ]);
        const bucket = getProjectUploadsBucket();
        if (!bucket) {
          return Response.json({ error: "Upload service not configured" }, { status: 503 });
        }
        return handleKindImageUpload(request, {
          requireUserId: async () => (await auth.requireUser()).id,
          bucket,
          newId: () => crypto.randomUUID(),
        });
      },
    },
  },
});
