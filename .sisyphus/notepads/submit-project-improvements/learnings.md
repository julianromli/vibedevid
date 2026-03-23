# Learnings

- Reused the server-route auth gate pattern from `app/dashboard/layout.tsx` and `app/blog/editor/page.tsx`: `redirect('/user/auth?redirectTo=...')` stays in the route layer, while the client form only receives props.
- Followed the server-page-to-client-props pattern from `app/blog/editor/[slug]/page.tsx` by fetching route data on the server and passing it into the interactive form component.
- Supabase gotcha: server route data loaders must import `createClient` from `lib/supabase/server` and `await` it; the browser client in `lib/supabase/client.ts` is only safe for client-side code.
- Shared modules imported by client code must never pull in `next/headers`; keep route-only server queries in the page file instead of pushing server clients into shared helpers.
- Extracted `submitProject` into `lib/actions/projects.ts` as a feature-scoped `'use server'` module using the shared `@/lib/supabase/server` client, while leaving unrelated legacy actions in `lib/actions.ts` untouched.
- Task 2 follow-up: keep the form-compatible `userId` parameter only as a compatibility hint, but use `supabase.auth.getUser()` as the mutation authority and resolve the inserted `author_id` from the authenticated server user.
- Task 3: `lib/actions/projects.ts` now routes submit payloads through a shared Zod normalizer (`validateAndNormalizeSubmitProjectInput`) so title/tagline/description/URL/image/category/tags are normalized and return field-aware validation errors before any DB insert runs.

- Task 3:  now routes submit payloads through a shared Zod normalizer () so title/tagline/description/URL/image/category/tags are normalized and return field-aware validation errors before any DB insert runs.
- Task 4: the submit form can safely carry UploadThing provisional state as a session-scoped `image_key` hidden in `FormData`; no DB column is needed as long as server actions consume and clear it during replace/remove/failure flows.
- Task 4: Vitest in this repo should mock `../../lib/uploadthing` with a pure stub instead of importing the real module, otherwise the test re-enters the `@/lib/supabase/server` alias path that earlier notes flagged as brittle.
- Task 5: GitHub import is safest when the route emits a fully normalized contract (`title`, `tagline`, `description`, `website_url`, `preview_image_url`, `favicon_url`, `tags`, `repo`) and the form treats imported text as fill-only for empty fields.
- Task 5: Direct Biome checks on the touched files were clean even though repo-wide lint/typecheck commands still surface unrelated workspace noise from generated/temp docs trees.
- Task 5: Playwright can deterministically cover the GitHub import merge policy by routing `**/api/github-import` in the spec and asserting user-visible fields after the import click.
- Task 5: The submit page is easiest to stabilize in E2E by logging in through `/user/auth` first, then waiting for `Project Details` before interacting with the import controls.

### Task 6: 4-Step Form Stepper
- To convert a monolithic form into a stepper while maintaining a single `FormData` submission, all fields must be fully controlled via React state (e.g. `title`, `description`, `category`). This ensures that conditionally rendered (or hidden) inputs still have their values accurately serialized on final submit.
- Creating a unified validation function (`validateCurrentStep`) hooked into the Next action helps block progression and surfaces immediate field feedback before reaching the final submission step.
- An explicit absolute/fixed mobile footer provides a safe sticky area for CTA buttons without interfering with native keyboard rendering, switching seamlessly to absolute within the Card bounds for desktop layouts.
