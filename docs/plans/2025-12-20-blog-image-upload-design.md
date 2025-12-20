# Blog Editor Image Upload (UploadThing) — Design

Date: 2025-12-20

## Goal

Enable users on `app/blog/editor/` to add images in two ways:

1. Paste an image URL (cover + editor content)
2. Upload an image file (cover + editor content) using existing project storage (UploadThing)

## Non-Goals

- Cropping/compressing images on client
- Image gallery / asset manager
- Deleting uploaded files (no UTApi cleanup workflow)
- Image alt-text UI (keep minimal; editor inserts `src` only)
- Multi-file uploads for a single action

## Context / Current State

- Cover image is stored as `posts.cover_image` (string URL) and rendered in blog list + detail pages.
- Editor uses TipTap `Image` extension; current UX inserts images via `window.prompt('Enter image URL')`.
- UploadThing is already set up:
  - Route handler: `app/api/uploadthing/route.ts`
  - Router: `lib/uploadthing.ts` with `projectImageUploader`
  - Client usage pattern exists in `components/ui/submit-project-form.tsx` using `@uploadthing/react` `UploadButton`.

## Key Decision

**Cover images must accept arbitrary domains** (user-provided URLs). Next.js `next/image` enforces `images.remotePatterns`, so we will render blog cover images using plain `<img>` instead of `next/image` to avoid runtime errors for non-allowlisted hosts.

This affects:

- `components/blog/blog-card.tsx` (blog listing cards)
- `app/blog/[id]/page.tsx` (blog post header cover)

## Requirements

### Functional

- Cover image input supports:
  - Paste URL (http/https)
  - Upload file → sets cover URL to uploaded file URL
  - Clear cover image
  - Optional preview
- Editor content image insertion supports:
  - Paste URL (http/https)
  - Upload file → inserts image into editor at cursor
- Only authenticated users can upload (reuse existing UploadThing middleware which checks Supabase auth).

### Validation

- Allow `https:` and `http:` URLs.
- If URL is `http:`, show a warning (possible mixed content on HTTPS site).
- Reject other schemes (`data:`, `file:`, `javascript:`).

### Upload constraints

- `blogImageUploader`: `{ maxFileSize: '4MB', maxFileCount: 1 }`

## Architecture

### Server (UploadThing)

Extend `lib/uploadthing.ts` with a new endpoint:

- `blogImageUploader`: same config as `projectImageUploader`
- Middleware: reuse existing Supabase auth check and return `{ userId }`
- `onUploadComplete`: return minimal data to client including URL.

Notes:

- UploadThing v7 response commonly uses `file.ufsUrl` as primary URL; keep a fallback to `file.url` to be resilient.

### Client

#### Cover

In `app/blog/editor/blog-editor-client.tsx`:

- Keep existing URL input.
- Add `UploadButton` (endpoint `blogImageUploader`) next to/below the URL input.
- On successful upload:
  - `const url = res?.[0]?.ufsUrl ?? res?.[0]?.url`
  - `setCoverImage(url)`
- Provide `Clear` action to set cover to empty string.
- Add `isUploadingCover` state; recommended: disable Publish while uploading.

#### Editor content images

In `components/blog/rich-text-editor.tsx`:

- Replace `window.prompt` flow with a small `Dialog`:
  - URL input + Insert button
  - UploadButton endpoint `blogImageUploader`
- On Insert URL:
  - Validate URL
  - `editor.chain().focus().setImage({ src: url }).run()`
  - Close dialog and reset input state
- On Upload complete:
  - Insert image using returned URL
  - Close dialog

## UX Details

- “Last action wins”: if user pastes a URL after uploading, it overwrites the cover; and vice versa.
- Error handling:
  - Upload errors show inline message and/or toast; dialog remains open for retry.
  - URL validation errors show toast and do not apply changes.

## Data Model / Persistence

- No schema changes.
- Store cover URL in `posts.cover_image` (already supported).
- Editor content stores images as TipTap JSON nodes with `type: 'image'` and `attrs.src`.

## Security Considerations

- Upload requires authenticated Supabase session (existing middleware).
- Do not log secrets; continue current pattern (only log token existence in route handler).
- For user-provided URLs:
  - Reject dangerous schemes.
  - Rendering via `<img>` allows external fetches; acceptable for this feature but should be noted.

## Files to Change (Implementation)

- `lib/uploadthing.ts` (add `blogImageUploader`)
- `app/blog/editor/blog-editor-client.tsx` (cover upload + preview + validation)
- `components/blog/rich-text-editor.tsx` (dialog-based image insert + UploadThing)
- `components/blog/blog-card.tsx` (cover render switch `next/image` → `<img>`)
- `app/blog/[id]/page.tsx` (cover render switch `next/image` → `<img>`)

## Implementation Plan (High Level)

1. Add UploadThing route `blogImageUploader`.
2. Add cover upload UI in blog editor client.
3. Add editor image dialog with URL + upload.
4. Switch cover renderers to `<img>` (blog card + blog post page).
5. Verify typecheck/lint/build and manual flow.

## Verification

- Typecheck: `pnpm exec tsc --noEmit`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Manual:
  - `/blog/editor`: upload cover → preview → publish
  - `/blog`: card shows uploaded cover (and arbitrary URL cover)
  - `/blog/[id]`: header shows cover
  - In editor: insert image via URL and via upload; published post renders images
