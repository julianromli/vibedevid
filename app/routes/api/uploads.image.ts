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
        const [{ handleKindImageUpload }, { getProjectUploadsBucket }, auth, accountStatus] =
          await Promise.all([
            import("@/lib/server/image-upload"),
            import("@/lib/server/stored-uploads"),
            import("@/lib/server/auth"),
            import("@/lib/server/account-status"),
          ]);
        const bucket = getProjectUploadsBucket();
        if (!bucket) {
          return Response.json({ error: "Upload service not configured" }, { status: 503 });
        }
        return handleKindImageUpload(request, {
          getUserId: async () => (await auth.getServerSession())?.user?.id ?? null,
          blockReason: accountStatus.mutationBlockReason,
          bucket,
          newId: () => crypto.randomUUID(),
        });
      },
    },
  },
});
