# Multi-Image Project Submission Plan

**Goal:** Allow users to submit projects with multiple images (up to 10) and display them as a carousel on the published project URL.

---

## Context

Currently, the `projects` table stores a single `image_url TEXT` column, and the submit/edit forms only support one image upload. This feature extends the data model and UI to support multiple images per project with carousel navigation.

---

## Phase 1: Database Migration

**Files:** `scripts/22_add_project_images.sql` (new migration)

- Add `image_urls TEXT[]` column (array of image URLs)
- Add `image_keys TEXT[]` column (array of UploadThing keys for cleanup)
- Migrate existing `image_url` data to `image_urls` (single-item array)
- Drop old `image_url` column
- Add RLS policy updates if needed

---

## Phase 2: UploadThing Configuration Update

**Files:** `lib/uploadthing.ts`

- Change `projectImageUploader` from `maxFileCount: 1` to `maxFileCount: 10`
- Update type definitions for multi-file upload

---

## Phase 3: Server Actions - Submit Project

**Files:** `lib/actions/projects.ts`

- Update `SubmitProjectInput` interface to handle `imageUrls: string[]` and `imageKeys: string[]`
- Update `validateAndNormalizeSubmitProjectInput` to validate array of images
- Update `insertProject` to store `image_urls` and `image_keys` arrays
- Update cleanup logic for provisional uploads to handle multiple keys

---

## Phase 4: Server Actions - Edit Project

**Files:** `lib/actions.ts`

- Update `editProject` function to handle `image_urls TEXT[]` and `image_keys TEXT[]`
- Add image removal/replacement logic with proper cleanup

---

## Phase 5: Image Carousel Component

**Files:** `components/ui/project-image-carousel.tsx` (new component)

- Create reusable carousel component with:
  - Previous/Next buttons
  - Dot indicators
  - Keyboard navigation (left/right arrows)
  - Image counter display (e.g., "2 / 5")

---

## Phase 6: Submit Project Form - Multi-Image Support

**Files:** `components/ui/submit-project-form.tsx`

- Change `uploadedImageUrl` state to `uploadedImageUrls: string[]`
- Change `uploadedImageKey` state to `uploadedImageKeys: string[]`
- Allow multiple image uploads (show thumbnails grid)
- Add individual image removal buttons
- Update review section to show all images
- Update validation to require at least 1 image

---

## Phase 7: Edit Project Form - Multi-Image Support

**Files:** `components/project/ProjectEditClient.tsx`

- Update state to handle array of images
- Add UploadButton for adding new images
- Show image thumbnails with remove buttons
- Update form submission to send image arrays

---

## Phase 8: Project Display Page - Carousel Integration

**Files:** `app/project/[slug]/page.tsx`

- Replace single `<Image>` with `<ProjectImageCarousel>`
- Pass `project.image_urls` array to carousel

---

## Phase 9: Data Fetching Updates

**Files:** `lib/actions.ts` (getProjectBySlug)

- Update `formattedProject` to return `image_urls` array
- Handle backward compatibility for projects with no images array

---

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| UploadThing | Image storage | Already configured, just needs `maxFileCount` increase |
| Supabase | Database | Already in use, just schema migration |
| `lucide-react` | Icons | Already used (`ChevronLeft`, `ChevronRight`) |

**No new external dependencies required.**

---

## Risks

### HIGH:
1. **Database Migration Complexity**: Converting `image_url TEXT` to `image_urls TEXT[]` with existing data requires careful migration
2. **Breaking Changes in Multiple Files**: Changes span database, server actions, and multiple UI components

### MEDIUM:
1. **Image Cleanup Logic**: Managing multiple upload keys for deletion when images are replaced or removed
2. **Edit Form State Management**: Adding multi-image support increases state complexity

### LOW:
1. **Carousel UX**: Ensure carousel works well on mobile and desktop
2. **Performance**: Consider lazy loading for multiple images

---

## Files Summary

| Phase | Action | Files |
|-------|--------|-------|
| 1 | Migration | `scripts/22_add_project_images.sql` |
| 2 | UploadThing Config | `lib/uploadthing.ts` |
| 3 | Submit Actions | `lib/actions/projects.ts` |
| 4 | Edit Actions | `lib/actions.ts` |
| 5 | Carousel Component | `components/ui/project-image-carousel.tsx` |
| 6 | Submit Form | `components/ui/submit-project-form.tsx` |
| 7 | Edit Form | `components/project/ProjectEditClient.tsx` |
| 8 | Display Page | `app/project/[slug]/page.tsx` |
| 9 | Data Fetching | `lib/actions.ts` |

---

## Verification

After implementation:

```bash
bun run lint
bunx tsc --noEmit
bun run test
```
