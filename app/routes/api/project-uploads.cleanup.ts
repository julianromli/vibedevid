import { createFileRoute } from "@tanstack/react-router";
import { cleanupProjectProvisionalUpload } from "@/lib/actions/projects";
import { handleUploadCleanupRequest } from "@/lib/project-upload-cleanup-request";

export const Route = createFileRoute("/api/project-uploads/cleanup")({
  server: {
    handlers: {
      POST: ({ request }) => handleUploadCleanupRequest(request, cleanupProjectProvisionalUpload),
    },
  },
});
