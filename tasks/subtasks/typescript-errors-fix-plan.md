# TypeScript Error Fix Plan

## Relevant Files

- `app/api/vibe-videos/[id]/route.ts`
- `app/blog/[id]/page.js` (stale .next reference)
- `app/calendar/page.tsx`
- `app/user/auth/page.tsx`
- `components/ui/optimized-avatar.tsx`
- `components/ui/submit-project-form.tsx`
- `hooks/useProgressiveImage.ts`
- `lib/actions.ts`
- `lib/image-utils.ts`
- `tests/views-tracking.spec.ts`

### Notes

- Step 0 clears stale `.next/` output to eliminate phantom errors.
- Keep each fix minimal-risk and isolated to the file reported.
- Validate after each step: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`.

Example:

- `- [ ] 1.1 Read file` -> `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Refresh generated Next.js types
  - [ ] 0.1 Remove `.next/` to clear stale types
  - [ ] 0.2 Regenerate types via `bun dev` or `bun build`
  - [ ] 0.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 1.0 Fix API route params typing
  - [ ] 1.1 Update handler context to accept `params: Promise<{ id: string }>` and `await` it
  - [ ] 1.2 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 2.0 Fix calendar range selection typing
  - [ ] 2.1 Align `onSelect` to accept `DateRange | undefined`
  - [ ] 2.2 Ensure state type matches `DateRange | undefined`
  - [ ] 2.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 3.0 Fix auth checkbox checked state typing
  - [ ] 3.1 Update `onCheckedChange` handler to accept `CheckedState`
  - [ ] 3.2 Map `CheckedState` to boolean as needed
  - [ ] 3.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 4.0 Fix optimized avatar initial state typing
  - [ ] 4.1 Allow `string | null | undefined` in initial `useState` or provide fallback
  - [ ] 4.2 Guard downstream usage of `src` as needed
  - [ ] 4.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 5.0 Fix submit project form UploadButton generic
  - [ ] 5.1 Import `UploadButton` from `@/lib/uploadthing-client`
  - [ ] 5.2 Apply router type generic (e.g., `UploadButton<OurFileRouter>`)
  - [ ] 5.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 6.0 Fix progressive image ref typing
  - [ ] 6.1 Use `useRef<HTMLImageElement | null>(null)` for nullable refs
  - [ ] 6.2 Guard ref usage before dereference
  - [ ] 6.3 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 7.0 Fix likes data indexing type
  - [ ] 7.1 Narrow `likesData` to `Record<string, T>` or add safe access guards
  - [ ] 7.2 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 8.0 Fix image utils getImageProps return typing
  - [ ] 8.1 Return the `props` field (or adjust function return type to match)
  - [ ] 8.2 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`

- [ ] 9.0 Fix Playwright user agent usage
  - [ ] 9.1 Set `userAgent` on context (or `test.use`) instead of `page.setUserAgent`
  - [ ] 9.2 Validate: `bun tsc --noEmit`, `bun lint`, `bun build`, `bunx playwright test`
