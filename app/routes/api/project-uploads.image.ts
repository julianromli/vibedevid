import { createFileRoute } from "@tanstack/react-router";

/**
 * Project screenshot upload to R2. Server-only modules load inside the handler
 * so this route module stays client-safe in the generated route tree.
 */
export const Route = createFileRoute("/api/project-uploads/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [
          { handleProjectImageUpload },
          { getProjectUploadsBucket },
          auth,
          uploads,
          accountStatus,
        ] = await Promise.all([
          import("@/lib/server/project-image-upload"),
          import("@/lib/server/stored-uploads"),
          import("@/lib/server/auth"),
          import("@/lib/server/project-uploads"),
          import("@/lib/server/account-status"),
        ]);
        const bucket = getProjectUploadsBucket();
        if (!bucket) {
          return Response.json({ error: "Upload service not configured" }, { status: 503 });
        }
        return handleProjectImageUpload(request, {
          getUserId: async () => (await auth.getServerSession())?.user?.id ?? null,
          blockReason: accountStatus.mutationBlockReason,
          bucket,
          record: uploads.recordProjectUpload,
          newId: () => crypto.randomUUID(),
        });
      },
    },
  },
});
