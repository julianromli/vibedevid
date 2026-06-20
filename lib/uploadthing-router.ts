/**
 * Client-safe type definitions for the Uploadthing file router.
 *
 * This module intentionally imports ONLY from `uploadthing/types`, which is a
 * type-only, client-safe entrypoint. It must never import `uploadthing/server`
 * (which transitively pulls in `react-dom/server`). Client components that need
 * the router type for `UploadButton<OurFileRouter, ...>` should import from here
 * instead of `@/lib/uploadthing`, so the server module is never dragged into the
 * client bundle.
 */
import type { FileRouter } from 'uploadthing/types'

export type UploadedFileMetadata = {
  key: string
  name: string
  uploadedBy: string
  url: string
}

/**
 * Endpoint keys exposed by {@link import('./uploadthing').ourFileRouter}.
 *
 * `UploadButton<OurFileRouter, TEndpoint>` only needs the set of valid endpoint
 * names plus the `FileRouter` shape, so we model the router as a `FileRouter`
 * record constrained to these keys. The runtime router in `lib/uploadthing.ts`
 * is asserted to satisfy this type to keep the two in sync.
 */
export type OurFileRouterEndpoint = 'projectImageUploader' | 'blogImageUploader'

export type OurFileRouter = FileRouter & Record<OurFileRouterEndpoint, FileRouter[string]>
