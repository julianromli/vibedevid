import { UPLOAD_MAX_BYTES } from "@/lib/r2-uploads";
import { handleImageUpload, type ImageUploadDeps } from "@/lib/server/image-upload";

/** Same limit the UploadThing route had. The client compresses before upload. */
export const PROJECT_IMAGE_MAX_BYTES = UPLOAD_MAX_BYTES.projects;

export interface ProjectImageUploadDeps extends ImageUploadDeps {
  record: (input: { key: string; url: string; userId: string }) => Promise<void>;
}

/**
 * One screenshot per request. Same checks as every image upload, plus a ledger
 * row so submit only accepts files this user uploaded. If the ledger write
 * fails the stored object is deleted, since submit would reject it anyway.
 */
export function handleProjectImageUpload(
  request: Request,
  deps: ProjectImageUploadDeps,
): Promise<Response> {
  return handleImageUpload(request, deps, {
    kind: "projects",
    maxBytes: PROJECT_IMAGE_MAX_BYTES,
    tooLarge: "Screenshots must be 4MB or smaller",
    signedOut: "You must be signed in to upload screenshots",
    afterStore: deps.record,
    saveFailed: "The screenshot could not be saved",
  });
}
