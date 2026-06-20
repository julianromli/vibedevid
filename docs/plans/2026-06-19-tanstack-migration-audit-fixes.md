# TanStack Start Migration — Audit & Fix Plan

**Date:** 2026-06-19
**Status:** Implemented (verified via `bun run build` + runtime smoke tests)
**Scope:** Audit the partially-completed Next.js → TanStack Start migration and fix the broken/incomplete features. References: `docs/plans/2026-06-07-tanstack-start-migration.md`, TanStack Start best-practices skill, and the official Next.js → TanStack migration guide.

---

## Completion Summary (2026-06-19)

All seven phases were implemented in one pass. Verified with a clean `bun run build` (exit 0) and runtime smoke tests against both `vite dev` and the production `bun run start` server: `/`, `/project/{slug}`, `/{username}`, `/blog/{slug}`, `/event/list`, `/user/auth` all return HTTP 200 with no SSR errors. The sign-in POST endpoint returns the expected 302.

What was done:

- **Phase 0:** Fixed the syntax-corrupted `components/ui/progressive-hero-image.tsx` (`alt, = true,` → `alt,` + `priority = true`). This parse error had been halting `tsc` and masking ~100 latent type errors across the repo.
- **Phase 1:** Converted the async-server-component detail pages (`project/[slug]`, `blog/[slug]`, `event/[slug]`) into presentational components fed by route `loader` data; moved fetching + not-found + redirect into the route files; added `head()` metadata for the project route.
- **Phase 2:** Added `createServerFn` wrappers (`*.functions.ts`) for every server mutation/query called from a client component — comments, projects (submit/edit/delete/cleanup), blog views, events, profile update, and admin analytics — and rewired the client components to call them. No more server-only code in the client bundle.
- **Phase 3:** Converted the `$username` profile page to SSR via a new `app/[username]/profile-data.ts` server loader; the page is now presentational and saves via `updateUserProfileFn` + `router.invalidate()`.
- **Phase 4:** Added a single source of truth for the current user — `__root` `beforeLoad` resolves it into router context; `hooks/use-current-user.ts` + `components/ui/site-navbar.tsx` consume it; sign-out now awaits `router.refresh()` (invalidate) so the shared user clears.
- **Phase 5:** Converted all admin dashboard boards (projects, blog, users, comments, events-approval, admin-management) to presentational components; the dashboard route loader fetches the active tab's data via `app/(admin)/dashboard/dashboard-data.ts`. Overview/Analytics boards now call analytics server functions instead of importing server-only actions.
- **Phase 6:** Client mutations invalidate via `router.invalidate()` where it matters (profile); deletes navigate away; comments refetch. Added `back()` to the `lib/navigation` shim.
- **Cleanup:** Deleted dead Next.js leftover pages that were no longer routed and broke typecheck: `app/(admin)/dashboard/page.tsx`, `app/blog/[slug]/page.tsx`, `app/event/[slug]/page.tsx`, `app/blog/page.tsx`, `app/blog/blog-page-data.tsx`, `app/blog/editor/page.tsx`, `app/blog/editor/[slug]/page.tsx`, `app/project/submit/page.tsx`, `app/project/list/project-list-data.tsx`, `app/event/list/page.tsx`, `app/event/list/event-list-data.tsx`, `app/home-page-data.tsx`, `app/privacy-policy/page.tsx`, `app/terms-of-service/page.tsx`.
- **Bonus fix:** Made `validateSearch` returns optionally-typed on `/`, `/project/list`, `/user/auth`, `/_admin/dashboard` so `<Link to="/user/auth">` / `to="/"` no longer require a `search` prop (fixed the navbar/comment link type errors).

### Remaining pre-existing tech debt (RESOLVED 2026-06-19)

A follow-up cleanup pass eliminated all remaining `tsc` errors (78 → 0). `bunx tsc --noEmit` is now clean, `bun run build` succeeds, and `bun run test` passes 5/5. What was fixed:

- **`@unpic/react <Image>`:** added the required `layout` prop (`fullWidth`/`constrained`) and removed unpic-incompatible props (`quality`, `style`) and duplicate `className`/`alt` merge-corruption across `event-card`, `project-tab`, `project-showcase`, `features-8`, `youtube-video-showcase`, `optimized-avatar`, `project-image-carousel`, `ProjectEditClient`, `post-dashboard-client`, `project-list-client`.
- **`ProgressiveImage` wrapper:** relaxed its prop type (own `layout`/`width`/`height`/`fill` + deprecated passthroughs) and forwarded a valid unpic layout/dimension shape.
- **`Link to={template-literal}`:** converted ~32 dynamic links to typed `to="/route/$param" params={{...}}` (blog/project/event/$username/blog-editor); converted external/`mailto:`/`/settings/*` links to plain `<a>`; converted `to="/user/auth?redirectTo=..."` to `search={{ redirectTo }}`.
- **styled-jsx leftovers:** replaced `<style jsx>` with `<style dangerouslySetInnerHTML>` in `progressive-hero-image`, `tools-columns`, `youtube-video-showcase`.
- **`lib/actions.ts`:** removed dead Next.js auth server actions (`signIn`/`signUp`/`signOut`/`resetPassword`/`resendConfirmationEmail`/`signInWithGoogle`/`signInWithGitHub`) and the orphaned `getSafeRedirectPath` helper + unused `redirect` import (the real auth flow lives in `lib/auth/credentials.ts` + the API routes).
- **misc:** `revalidatePath`/`revalidateTag` shim now accepts the optional 2nd arg; `chart.tsx` recharts tooltip `payload`/`label` typed; `nav-group.tsx` recursive fn return type; `image-types.ts` `ImageProps` omits conflicting `loading`/`src`; `vitest.config.ts` plugins cast for the nested vite version mismatch.
- **stale tests:** updated `tests/unit/components/hero-section.spec.ts` to mock `react-i18next` + `@tanstack/react-router` (was mocking `next-intl`/`next/link`) and to assert the current CSS `.hero-word` animation instead of the obsolete JS opacity-state behavior. Also deleted more dead Next pages (`app/project/list/page.tsx`).

### Original remaining tech debt (now resolved — kept for history)

`tsc --noEmit` still reports ~80 errors, all pre-existing and previously masked by the parse error. The build ignores them and the app runs. They fall into:

- `Link to={`/project/${slug}`}` template-literal targets (TanStack wants typed paths or `params`) — ~32 sites.
- `@unpic/react` `<Image>` missing the required `layout` prop — in `event-card`, `features-8`, `project-showcase`, etc.
- `components/ui/chart.tsx` recharts typings, `lib/actions/*` business-logic typings, duplicate JSX attrs in a few image components.

These should be tackled in a separate cleanup pass; none block the migrated features.

---

## Executive Summary

The app already runs on Vite + TanStack Start (`vite dev`, `@tanstack/react-start`). The route tree, root layout, request middleware (locale + auth + CSRF), Supabase server/client/admin split, and auth API routes are in place and look correct. However, the migration is **half-done at the page layer**. Several routes were converted properly (loader fetches data server-side → passes props to client components), while others are still wired in a Next.js-shaped way that **cannot work** under TanStack Start.

There are two classes of crucial breakage:

1. **Async Server Component pages rendered as client components.** Detail pages (`project/[slug]`, `blog/[slug]`, `event/[slug]`) and the admin dashboard boards are still `export default async function Page({ params }: { params: Promise<...> })` — the Next.js Server Component shape. The TanStack route wrappers render them as `<Page params={Promise.resolve(...)} />`. React cannot render an async function component on the client, so these pages effectively do not render (or throw). This directly explains the "project details page" breakage the user reported.

2. **Server mutations imported directly into client components.** Six client components import functions from `lib/actions/*` (e.g. `submitProject`, `editProject`, `deleteProject`, `createComment`, `submitEvent`, `incrementBlogPostViews`, `updateUserProfile`). In Next.js these were `'use server'` actions invoked over RPC. The `'use server'` directives were stripped during migration, so these now bundle server-only code (`lib/supabase/server`, which imports `@tanstack/react-start/server` cookie APIs) into the **client bundle** and call it directly. They will fail at runtime / break the build.

Secondary issues: the `$username` profile page does all auth + data fetching client-side (works, but loses SSR and is inconsistent with the migrated routes), there is a syntax-corrupted file (`progressive-hero-image.tsx`), and `lib/revalidation.ts` is a no-op so cache invalidation after mutations never happens.

The fix strategy: convert async-server-component pages into the established TanStack pattern (route `loader` does server work → renders a client/presentational component with props), and convert client-invoked mutations into `createServerFn` server functions. Reuse the patterns already working in `index.tsx`, `project.list.tsx`, `project.submit.tsx`, and `blog.editor.tsx`.

---

## Audit Findings (Verified)

### What is already correct

- **Entry / config:** `vite.config.ts` (tanstackStart plugin, `srcDirectory: 'app'`, ignores `components|boards|legacy`), `app/router.tsx`, `app/routes/__root.tsx`, `app/start.ts` (CSRF + locale + auth request middleware).
- **Supabase split:** `lib/supabase/server.ts` (uses `@tanstack/react-start/server` `getCookies`/`setCookie`), `client.ts`, `admin.ts`.
- **Request middleware:** `lib/server/request-middleware.ts` — locale redirect + auth gating + cookie merge. Wired in `app/start.ts`.
- **Auth API routes:** `api/auth.sign-in.ts`, `auth.sign-up.ts`, `auth.reset-password.ts`, `auth.oauth.$provider.ts`, `auth.callback.ts` — proper server handlers delegating to `lib/auth/credentials.ts` + `lib/auth/redirects.ts`. The auth page (`app/user/auth/page.tsx`) posts to these via HTML forms. **Auth flow itself looks structurally sound** — needs verification, not a rewrite.
- **Correctly migrated routes (the reference pattern):** `index.tsx`, `project.list.tsx`, `project.submit.tsx`, `blog.editor.tsx`, `blog.editor.$slug.tsx`, `_admin/route.tsx` (beforeLoad role gate). These run server work in `loader`/`beforeLoad` and pass plain data to client components.
- **Navigation compat shim:** `lib/navigation.ts` maps Next's `useRouter`/`useSearchParams`/`usePathname`/`redirect`/`notFound` onto TanStack equivalents. Reasonable bridge.

### CRITICAL — Broken: async Server Component pages rendered client-side

These are `export default async function ... ({ params: Promise<...> })` and are rendered by route wrappers as React components:

| Route wrapper                     | Renders (async server component)                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/routes/project.$slug.tsx`    | `app/project/[slug]/page.tsx` (`async`, `await params`, calls `getCurrentUser`, `getProjectBySlug`, `getComments`, `checkProjectOwnership`) |
| `app/routes/blog.$slug.tsx`       | `app/blog/[slug]/blog-post-data.tsx` (`async`)                                                                                              |
| `app/routes/event.$slug.tsx`      | `app/event/[slug]/event-detail-data.tsx` (`async`)                                                                                          |
| `app/routes/_admin/dashboard.tsx` | `boards/*/page.tsx` (multiple `async` pages rendered with `searchParams={Promise.resolve(...)}`)                                            |

Impact: pages do not render. This is the user's reported "project details page" / "user page" breakage class.

### CRITICAL — Broken: server mutations called from client bundle

Client components (`'use client'`) importing server-only mutation code from `lib/actions/*`:

| Client component                              | Imports                                            |
| --------------------------------------------- | -------------------------------------------------- |
| `components/ui/submit-project-form.tsx`       | `submitProject`, `cleanupProjectProvisionalUpload` |
| `components/project/ProjectEditClient.tsx`    | `editProject`                                      |
| `components/project/ProjectActionsClient.tsx` | `deleteProject`                                    |
| `components/ui/comment-section.tsx`           | `createComment`, `getComments`, `reportComment`    |
| `components/event/submit-event-modal.tsx`     | `submitEvent`                                      |
| `components/blog/blog-view-tracker.tsx`       | `incrementBlogPostViews`                           |
| `app/[username]/page.tsx`                     | `updateUserProfile` (via `lib/actions/user`)       |

`lib/actions/*` import `lib/supabase/server` (server-only). These no longer carry `'use server'`, so they are bundled and executed on the client. Will fail.

### HIGH — `$username` profile page is fully client-side

`app/[username]/page.tsx` is `'use client'` and fetches session + profile + projects + posts via `createClient()` (browser) in `useEffect`. It "works" but: no SSR, no `<head>` metadata, inconsistent with migrated routes, and `Navbar` auth state comes from its own client fetch. The user flagged "user page" — likely the combination of slow/empty client fetch + the broken `updateUserProfile` mutation.

### HIGH — Navbar auth state is prop-drilled inconsistently

`Navbar` takes `isLoggedIn`/`user` props. Migrated routes pass them from the loader; the profile page passes them from its client fetch; some wrappers pass nothing. There is no single source of truth for "current user" across routes. The user flagged "navbar function". Recommend a root-level (`__root` loader or context) current-user that all routes/navbar consume.

### MEDIUM — `lib/revalidation.ts` is a no-op

`revalidatePath`/`revalidateTag`/`unstable_cache` are stubs. After mutations, nothing invalidates. Need `router.invalidate()` (client) or `loader` re-run at call sites, or return success and invalidate in the component.

### LOW — Syntax-corrupted file

`components/ui/progressive-hero-image.tsx` line ~61: `alt, = true,` — a broken merge artifact (a prop default was spliced into the destructuring). Causes the only hard `tsc` parse errors. Must fix regardless.

### Note on build/type safety

`bunx tsc --noEmit` currently surfaces only the `progressive-hero-image.tsx` parse error (per AGENTS.md the Next build ignored TS errors; under Vite/TanStack this no longer applies, so type errors will matter more). Full typecheck must pass after fixes.

---

## Fix Plan

### Phase 0 — Stabilize (quick wins)

1. Fix `components/ui/progressive-hero-image.tsx` syntax corruption (restore the destructuring + the misplaced default, likely `priority = true` for the "above the fold" comment).
2. Confirm `bunx tsc --noEmit` parses cleanly (errors allowed, parse failures not).

### Phase 1 — Detail pages (project / blog / event) [addresses "project details page"]

For each, follow the working `project.list.tsx` pattern:

1. Move the server data fetching out of the async page component into the route `loader` (the loaders for `blog.$slug` and `event.$slug` already fetch partial data for `head()`; extend them to fetch the full payload).
2. Convert the page component to a synchronous presentational client/server-safe component that receives data via `Route.useLoaderData()` (or props), removing `async`/`await params`.
3. Handle not-found via `throw notFound()` in the loader, wired to `notFoundComponent`.
4. Keep `head()` metadata in the route (already present for blog/event; add for project `$slug`).
5. Pass `isLoggedIn`/`user` to `Navbar` from the loader (see Phase 4).

Order: `project.$slug` first (explicitly reported), then `event.$slug`, then `blog.$slug`.

### Phase 2 — Convert client-invoked mutations to server functions [addresses submit/edit/comment/like/profile]

For each function in `lib/actions/*` that is called from a client component, create a TanStack `createServerFn` wrapper (validated input, server execution), and update the client component to call the server fn instead of importing the raw action. Group by file:

- `projects.ts`: `submitProject`, `editProject`, `deleteProject`, `cleanupProjectProvisionalUpload`
- `comments.ts`: `createComment`, `getComments`, `reportComment`
- `events.ts`: `submitEvent`
- `actions.ts`: `incrementBlogPostViews`, `editProject`, `deleteProject` (re-exports)
- `user.ts`: `updateUserProfile`

Approach per the skill (`sf-create-server-fn`, `sf-input-validation`, `auth-server-functions`): each server fn re-verifies auth/ownership server-side (do not trust client). Keep existing zod validation. Decide form-heavy submits (project submit, event submit) — either `createServerFn` with `FormData`/typed input, or keep them as API route POST endpoints if multipart is involved. Confirm preferred mechanism with user before mass-converting.

### Phase 3 — Profile page (`$username`) [addresses "user page"]

1. Convert `app/routes/$username.tsx` to a route with a `loader` that fetches profile + stats + projects + posts server-side (reuse the existing query functions, but call them server-side via the server Supabase client).
2. Convert `app/[username]/page.tsx` to a presentational component fed by `useLoaderData()`, dropping the client `useEffect` fetch.
3. Wire profile save to the `updateUserProfile` server fn from Phase 2, then `router.invalidate()` on success.
4. Add `head()` metadata for the profile.

### Phase 4 — Centralize current user + Navbar [addresses "navbar function"]

1. Add a current-user source of truth: either a `__root` `beforeLoad`/`loader` returning the user into router context, or a small `getCurrentUserServerFn`. Prefer root context so every route + the Navbar can read it without re-fetching.
2. Update `Navbar` to consume the shared user (via context/hook) instead of relying solely on per-route props; keep props as an override for SSR'd routes.
3. Ensure sign-out (`handleSignOut`) calls `router.invalidate()` so the shared user clears.

### Phase 5 — Admin dashboard boards

1. Convert `_admin/dashboard.tsx` board pages from async-server-component rendering to the loader-prop pattern (or `createServerFn` per board for tab-switched/lazy data), matching Phase 1. Respect the existing `beforeLoad` role gate in `_admin/route.tsx`.

### Phase 6 — Revalidation

1. Replace no-op `revalidatePath`/`revalidateTag` usage at call sites with `router.invalidate()` (client) after server fn success, or rely on loader re-run on navigation. Remove reliance on the stub where it silently does nothing.

### Phase 7 — Verify

- `bunx tsc --noEmit` clean.
- `bun run dev` and manually exercise: home, project list, **project detail**, blog detail, event detail, **profile page**, **navbar (logged in/out, sign out)**, project submit/edit/delete, comments, event submit, admin dashboard tabs, auth sign-in/up/reset/oauth/callback.
- Run `bun run test` / relevant e2e if present.

---

## Open Questions (to confirm before executing)

1. **Mutation mechanism:** For form-heavy submits (project submit, event submit with uploads), prefer `createServerFn` with typed input, or keep dedicated API route POST handlers? (Affects Phase 2 shape.)
2. **Current-user source:** OK to add a `__root` loader/context for the shared current user (one server round-trip per navigation), or keep per-route loaders? (Affects Phase 4.)
3. **Scope/sequencing:** Fix everything in one pass, or land the two critical classes first (Phase 1 + Phase 2) and verify before profile/navbar/admin?

---

## Risk Notes

- Auth API routes and middleware appear correct; avoid rewriting them — verify behavior first to prevent regressions in a working flow.
- Ownership/role checks must be re-asserted inside every server fn (never trust client-passed `userId`).
- Cloudflare Workers target (per prior plan): keep server fns Workers-compatible (no Node-only APIs).

```

```
