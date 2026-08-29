# Thermo-Nuclear Review — Fix Plan

Branch: `architecture/deepening-project-blog-events` (055df4a + 9bcadc4 vs main).
Applies the review of the Project/Blog/Events architecture PR. Ordered so each
phase lands the behavioral preconditions for the next.

## Phase 0 — Docs: correct reports, not plans

**Files:** `CONTEXT.md`, `README.md`,
`tasks/supabase-security-hardening-plan.md` (the mis-citation lives here).

**Changes**

1. `CONTEXT.md`:
   - Replace the master-plan framing (lines 3-13 of Structure section) with a
     "current module contract" framing: describe where reads/writes live, no
     "must remain aligned" veto language, no future-tense instruction.
   - Move the Structure master plan (if kept at all) to `docs/` and reword the
     two events lines as present-tense statements of fact ("Related event read
     is category-based: `fetchRelatedEvents` in `lib/server/events-public.ts`").
2. `README.md`:
   - Remove the mis-citation `lib/actions/projects.functions.ts` for
     `incrementBlogPostViewsFn` in the hardening plan task.
   - Fix the "slug fallback" wording that reverses the actual `slug ?? name`
     precedence.
   - Adjust the Spec/Judo paragraph so editorializing (rejected-idea
     alternative names) doesn't imply verdicts that were never made.

**Acceptance:** grep shows no future-tense plan wording in `CONTEXT.md`;
README cites the file `incrementBlogPostViewsFn` actually lives in.

## Phase 1 — Read modules: throw, don't envelope

**Files:** `lib/server/project-public.ts`, callers:
`app/routes/project.$slug.tsx`, `app/routes/index.tsx`,
`app/routes/project.list.tsx`, `lib/actions/projects.functions.ts`
(fn wrapper), `app/project/[slug]/page.tsx`, `tests/unit/lib/project-public.spec.ts`.

**Changes**

1. `getProjectBySlug(slug): Promise<ProjectDetail | null>` — DB/auth errors
   **throw**. Absence still returns `null` (route keeps throwing `notFound()`).
   Remove `error` field. Delete `toLoggableError`.
2. `fetchProjectsWithSorting(...): Promise<ProjectCard[]>` — errors throw.
   Remove the catch-render-empty path entirely.
3. `getBatchLikeStatus`: keep only the inner `try` around the likes query (for
   the deliberate per-request degrade that stays); delete its outer
   try/catch, its "error" fields, and its nested zeroed-entries pass. It
   returns a record without a wrapper.
4. Callers:
   - `project.$slug.tsx`: use `const project = await …; if (!project) throw notFound()`.
   - `index.tsx`, `project.list.tsx`: `await fetchProjectsWithSorting(...)`.
   - Page types (`app/project/[slug]/page.tsx`) delisted from result-type
     gymnastics.
5. Keep the same behavior for `fetchProjectsWithSortingFn` (it still returns
   `{projects,[error]}` through the existing RPC seam; wire `error: null` on
   success, catch → `{projects: [], error}`).
6. Update `tests/unit/lib/project-public.spec.ts` to assert throw-on-DB-fail
   and shape-on-success; delete envelope-error assertions.

**Acceptance:** three read modules share one contract: `null` for absence,
throw for failure; no caller's semantics change (empty failure previously
rendered an empty list, which was indistinguishable — call it out in the PR
description as an intentional safety fix).

## Phase 2 — Blog detail: name the model, kill the cast

**Files:** `lib/server/blog-public.ts`, `app/routes/blog.$slug.tsx`,
`app/blog/[slug]/blog-post-data.tsx`, `tests/unit/lib/blog-public.spec.ts`,
`types/` (candidate home).

**Changes**

1. Introduce an explicit internal wire type, e.g.
   `interface PublishedPostDetail { id; title; slug; excerpt; content;
cover_image; author_id; status; published_at; created_at; updated_at;
read_time_minutes; featured; author: {display_name; avatar_url; role};
tags: BlogPostTagList }` — consumed by both `fetchPostDetailBySlug` and
   `BlogPostDataProps` (the component's `post: any` becomes this type).
2. `fetchPostDetailBySlug(): Promise<{ post: PublishedPostDetail; viewCount:
number } | null>`; drop `Record<string, unknown>`.
3. Route: call `getComments("post", detail.post.id)` — no `as string` needed.
4. Component: replace the current `contentToHtml(post.content as string)` and
   other field guards with the typed fields; keep the ignore-style comment
   only if a property legitimately remains broad.
5. Delete redundant `view_count` from the wire (no UI consumer — verified) or
   keep it only if an existing consumer outside this repo does; prefer
   deletion; `viewCount` is the count.

**Acceptance:** zero `unknown`/`any`/cast in the blog detail path; the route
has no type assertions; tests updated for shape.

## Phase 3 — Unify slug coincidence handling

**Files:** `lib/slug.ts` (or new `lib/slug-unique.ts`), `lib/actions/projects.ts`,
`lib/actions/events.ts`, `tests/unit/lib/events.spec.ts`,
`tests/unit/lib/project-submission.spec.ts`.

**Changes**

1. Extract `insertWithUniqueSlug(params: { baseSlug; insert(slug): Promise<T>;
isSlugConflict(err); onRetry(slug) })` — **single** mechanism: attempt
   insert, on 23505/slug regenerate `-n` and retry, bounded (≤100), throw
   "exhausted" consistently.
2. Delete `ensureUniqueEventSlug` (duplicated SELECT-loop in events.ts) and
   both `isSlugConflict` copies.
3. `submitEvent` and `createProjectWithRetry` become: compute `baseSlug`,
   call the helper, return.
4. `ensureUniqueSlug` in `lib/slug.ts`: retain as the SELECT-based generator
   but expose it as a pure preparation step plus the insert-retry primitive;
   remove the dead `excludeProjectId` parameter if it has no in-repo use.
5. Delete the `|| "project"` dead fallback in `slugifyTitle`.

**Acceptance:** grep shows one `23505` + `slug` occurrence outside the new
helper; events and project specs updated; new spec covers exhaustion.

## Phase 4 — Submission module: schema the typed input, drop the wire layer

**Files:** `lib/project-submission.ts`, `lib/actions/projects.ts`,
`components/ui/submit-project-form.tsx`, `components/project/ProjectEditClient.tsx`,
`lib/project-url.ts`, `tests/unit/lib/project-submission.spec.ts`.

**Changes**

1. Redeclare `buildProjectSubmissionSchema(categoryNames?)` to consume the
   **parsed** typed input (`ProjectSubmissionInput` shape: `imageUrls:
string[]`, `tags: string[]`, `websiteUrl: string | null`) — the
   existing output type becomes the input type.
2. Introduce `parseProjectFormData(formData: FormData): Result<…>` at the
   server seam: read string fields (keep `readProjectFormData` behavior),
   plus JSON-parse imageUrls/imageKeys/tags with the same error messages;
   returns zod `ZodError`s on failure.
3. `submitProject`/`editProject`: call `parseProjectFormData` then `safeParse`.
4. `PROJECT_FIELD_SCHEMAS`: keyed by field, now typed field-schema level
   (not string-parse wrappers) — used only by the wizard client.
5. Submit form: `validateCurrentStep` and the final gate call schema with the
   step's typed subset (no `JSON.stringify`-then-parse hop).
6. `ProjectEditClient`: `submitEditFields(…, categories)` or direct object —
   **no** `new FormData()` construction; delete the encode/decode.
7. Delete `isValidProjectWebsiteUrl` if confirmed dead; keep
   `normalizeProjectWebsiteUrl` as canonical.
8. Rename `ProjectScreenshotFieldErrors` → `ProjectFieldErrors`; re-export as
   needed.

**Acceptance:** `grep` shows no `imageUrls: z.string()` or FormData
construction in the edit client; one schema instance for the whole seam; zod
paths remain snake_case for `buildProjectFieldErrors`.

## Phase 5 — Dashboard: verify loader semantics, then harden narrowing

**Files:** `app/routes/_admin/dashboard.tsx`, `app/(admin)/dashboard/dashboard-data.ts`,
board components under `app/(admin)/dashboard/boards/`.

**Changes**

1. Verify (dev run + a build): `Route.loader` invoking
   `loadAdminDashboardData({ data: deps.search })` no-ops on the client as
   `createServerFn` contract guarantees, and every dashboard board is
   server-fn-wrapped (per-board `createServerFn`), or no client-side
   re-execution can surface nulls. If a board isn't wrapped, wrap it before
   shipping.
2. Remove the seven `if (boardData.kind !== "X") return <Overview />;`
   fallback branches: `DashboardTabPanel` switches on `boardData.kind`
   directly (drop the `tab` param); `TAB_TITLES` lookup moves to the route
   (it already owns `activeTab`). A disagreement becomes a type error, not a
   silent Overview.

**Acceptance:** no kind-guard fallthrough; adding a board still requires
exactly one union member + one case.

## Phase 6 — Hardening / hygiene follow-ups

**Files:** `lib/actions/projects.ts`, `components/project/ProjectEditClient.tsx`,
`components/ui/submit-project-form.tsx`, `lib/project-submission.ts`.

**Changes**

1. `deleteProject`: move the UploadThing deletion (`deleteUploadthingFiles`)
   before the DB `DELETE`, so partial DB failure can't orphan uploaded
   files; keep the existing best-effort catch around it.
2. `parseTags`: treat length overflow as terminal (`z.NEVER`), matching
   `parseImageArray`.
3. Make the client-side resource prevention real: add
   `uploadedImageUrls.length < PROJECT_LIMITS.MAX_IMAGE_COUNT` guard to
   `LinksMediaStep`'s UploadThing `onBeforeUploadBegin` (already has
   `onUploadError`).
4. Uniform `formatProjectFieldErrors` (single formatter, no per-field
   `charAt(0).toUpperCase()` construction) shared by the two client paths and
   server result assembly.
5. `editProject`: replace favicon re-fetch-on-any-website with "fetch only if
   website changed (or first-set), else preserve" — use the known previous
   value from the project row.

**Acceptance:** grep check for `VIEW`-related dead code; no functional
regressions.

## Verification checklist (run at end of every phase and before merge)

- [x] `bun run test` — **50/50 passing** (7 files). The `bunx vitest run` bin
      resolution failure was a vendored-toolchain inconsistency (project pins
      `vitest` to bin-less `@voidzero-dev/vite-plus-test@0.1.24` while `vp test`
      expects the bundled `vitest@4.1.9` with a bin). Fixed by pointing the test
      scripts at the vendored CLI (`bun node_modules/vitest/dist/cli.js run`) and
      aliasing `zod` in `vitest.config.ts` to `tests/setup/zod-shim.ts` (the
      runner resolves zod's `@zod/source` condition, which has no runtime `z`
      namespace; the shim re-exports the built `v4/classic/external.js` entry).
- [x] `tsc --noEmit` — 0 errors.
- [x] `grep Record<string, unknown>` — blog detail path is now
      `PublishedPostDetail`; the only remaining cast is the contentToHtml call
      (TipTap's recursive node type), now inside a dedicated `renderPostContent`
      helper with the XSS suppression honored.
- [x] `grep z.NEVER lib/project-submission.ts` — single occurrence, the
      invalid-website-URL branch; all other failures are terminal via `.min(1)`
      on a closed typed schema (no lhs-op poisoning possible).
- [x] Manual smoke (dev server on :3000, agent-browser + curl) — **2026-08-29**:
  - `/project/list` → 200; Top sort reorders (`Steal the Style` 6, `Helipod` 5…);
    Trending + category "AI" filter → 6 labeled cards; dropdown changed via RPC.
  - `/blog/:slug` ("opencode-cli…") → 200; renders **257 views** (counts query),
    3 tags, author + role, content via `renderPostContent`; 0 console/page errors.
  - `/project/estimato` → 200; stats render (Total Views/Unique/Today/Likes all 0).
  - `/event/:slug` → 200; workshop badge, About, related events render.
  - 404 contract: missing `/project|/blog|/event/:slug` → 404 (not error envelopes).
  - `/project/submit`, `/dashboard` → 307 to `/user/auth` (auth gate intact).
- [ ] Auth-requiring smoke: project submit + edit, admin dashboard boards, event
  submit (incl. seeded slug-collision retry). Blocked: no seeded/demo auth
  credentials in repo or `.env.local`; requires creating a real account on the
  dev DB. _Left for the user (sign-up exists via Better Auth email flow)._

## Implemented deltas vs plan

- Phase 1: read modules now return `ProjectDetail | null` / `ProjectCard[]`
  and throw; the `.functions` RPC still returns `{ projects, error }` for the
  client filter hook, catching at the wire.
- Phase 2: `PublishedPostDetail` shared by the route and the component;
  redundant `view_count` dropped from the wire (viewCount is the counts
  query); component's `post: any` deleted.
- Phase 3: one `insertWithUniqueSlug` primitive (try + 23505/slug retry,
  bounded 100); `ensureUniqueSlug` and both `isSlugConflict` copies deleted;
  `ensureUniqueEventSlug` loop gone; dead `excludeProjectId` +
  `SlugGenerationOptions` + `"project"` fallback removed.
- Phase 4: schema consumes the typed model; `parseProjectFormData` is the
  only FormData reader; `ProjectEditClient` validates a typed object (raw URL
  goes to the schema so invalid URLs still fail client-side); tag
  normalization lives in the schema transform; `ProjectScreenshotFieldErrors`
  renamed `ProjectFieldErrors`.
- Phase 5: panel narrows on `boardData.kind`; seven fallback Overviews
  deleted. `tab` is retained for one legitimate reason: overview vs
  analytics (both carry `kind: "client-fetched"`, only tab distinguishes).
- Phase 6: UploadThing deletion before row deletes; real client-side image
  count gate in `onBeforeUploadBegin`; favicon re-fetched only when the
  website URL actually changed; unused `Analytics`/`Project` imports and the
  dead `React` import in `lib/slug.ts` removed.
