# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-23
**Commit:** 2d09393
**Branch:** main

## OVERVIEW

VibeDev ID is a Next.js 16 App Router app backed by Supabase, `next-intl`, Bun, Biome, Vitest, and Playwright. This repo also contains `admin-kit/`, a separate Next.js 15 package with its own pnpm + ESLint + Prettier workflow.

This is the only repo-local `AGENTS.md`. Ignore `%TEMP%/nextjs-docs/AGENTS.md`; it is imported reference material, not repo-local policy.

## STRUCTURE

```text
./
├── app/              # Next.js 16 routes, layouts, API handlers
├── components/       # feature components + shared wrappers
├── lib/              # helpers, Supabase, auth, SEO, uploads
├── docs/             # operational and design documentation
├── scripts/          # SQL migrations + repo scripts
├── admin-kit/        # separate Next.js 15 package
```

## ROOT COMMANDS

```bash
bun run dev
bun run lint        # changed files only
bun run lint:all
bunx tsc --noEmit   # required; build ignores TS errors
bun run test
bun run test:e2e
bun run build
```

## GLOBAL WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| auth/session | `lib/server/auth.ts`, `lib/supabase/*` | server/client/admin split |
| project submit/edit | `components/ui/submit-project-form.tsx`, `lib/actions/projects.ts` | Uploadthing + validation + cache refresh |
| admin moderation | `app/(admin)/*`, `lib/actions/admin/*`, `lib/actions/events.ts` | role-gated dashboard subtree |
| public `/admin` page | `app/admin/page.tsx` | separate from `app/(admin)` |
| docs index | `docs/README.md` | keep links current |
| DB history | `scripts/*.sql`, `docs/migrations/*`, `docs/database/*` | numbered migration flow |

## GLOBAL CONVENTIONS

- Use Bun at the repo root.
- Use Biome at the repo root; do not introduce root-level ESLint/Prettier workflows.
- Prefer Server Components in `app/`; client-heavy files commonly use `*-client.tsx`.
- Put server mutations in `lib/actions/*` with `'use server'`.
- `components/ui/` is the shared UI layer; feature-specific components live in sibling folders.
- `next-intl` is wired through `i18n/request.ts`, `messages/*.json`, and `app/layout.tsx`.

## GLOBAL ANTI-PATTERNS

- Do not rely on `bun run build` for type safety; `next.config.mjs` sets `typescript.ignoreBuildErrors = true`.
- Do not mix root tooling assumptions with `admin-kit/`.
- Do not create or update files under `.next/`, `node_modules/`, `playwright-report/`, `%TEMP%/`, or `nul`.
- Do not assume every `/admin` route is protected by `app/(admin)`.
- Do not duplicate Supabase client setup, env parsing, slug logic, or URL normalization outside `lib/`.

## APP GUIDE

### Overview

`app/` is the main Next.js 16 App Router tree: public routes, dynamic segments, route groups, API handlers, metadata, and auth callback entry points.

### Where To Look

- public homepage and global metadata: `app/layout.tsx`, `app/page.tsx`
- route groups and dashboards: `app/(admin)/*`, `app/dashboard/*`
- API handlers: `app/api/**/route.ts`, `app/api/**/route.tsx`
- auth callback: `app/auth/callback/route.ts`
- localized metadata/text: `app/layout.tsx`, `messages/*.json`

### Conventions

- Default to Server Components; existing client-heavy route helpers use `*-client.tsx`.
- Use `generateMetadata()` or route-level `metadata` where SEO differs by route.
- Use `next-intl/server` helpers such as `getLocale` and `getTranslations` for layout/page metadata work.
- Keep route handlers under `app/api/**/route.*`; do not hide them in feature folders.
- Reuse `lib/seo/site-url.ts` and `getSiteUrl()` for canonical URLs and metadata base.

### Special Cases

- `app/(admin)` is the protected admin dashboard route group.
- `app/admin/page.tsx` is a separate public-facing admin page and is not covered by `app/(admin)` rules.
- Dynamic routes already exist for usernames, blog posts, events, and projects; follow their slug/param patterns instead of inventing new ones.

### Verify

- run `bunx tsc --noEmit`
- run `bun run dev` for route/layout changes
- manually hit changed routes and relevant API handlers

### Anti-Patterns

- Do not hardcode locale-specific metadata strings when `next-intl` already owns them.
- Do not move route-specific server mutations into components; keep them in `lib/actions`.
- Do not assume `/admin` means `app/(admin)`.

## ADMIN DASHBOARD GUIDE

### Overview

`app/(admin)/` is the protected admin dashboard subtree. It uses a role check in layout, tabbed board views, and admin-only mutations backed by Supabase admin access where needed.

### Where To Look

- auth gate: `app/(admin)/layout.tsx`
- dashboard tabs and board composition: `app/(admin)/dashboard/page.tsx`
- board-specific UI: `app/(admin)/dashboard/boards/*`
- admin mutations: `lib/actions/admin/*`
- event moderation flow: `lib/actions/events.ts`

### Conventions

- Keep access control at the layout and server-action layer; this subtree already redirects non-admin users in `layout.tsx`.
- Treat each `boards/*` directory as an admin domain boundary: users, projects, blog, comments, events, analytics, overview.
- Reuse `components/admin-panel/*` and `components/ui/*` rather than pulling from unrelated packages.
- Use query-param driven filters, search, and tab state where the subtree already does so.

### Verify

- check the layout gate still redirects unauthorized users
- manually exercise changed board filters/actions in `bun run dev`
- re-check cache refresh and moderation state after admin mutations

### Anti-Patterns

- Do not apply these rules to `app/admin/page.tsx`; that file is outside this subtree.
- Do not expose admin data or actions without a role check.
- Do not bypass RLS with a public client when the change requires `createAdminClient()`.
- Do not reuse the main-site header/footer in this dashboard subtree.

## COMPONENTS GUIDE

### Overview

`components/` holds shared feature components, app shells, providers, and loose reusable pieces. It is broader than `components/ui/`; feature folders like `blog/`, `event/`, `project/`, `profile/`, `sections/`, `layout/`, and `admin-panel/` live here too.

### Where To Look

- shared providers/wrappers: `agentation-provider.tsx`, `theme-provider.tsx`, `search-provider.tsx`
- dashboard chrome: `admin-panel/*`, `layout/*`
- feature UI: `blog/*`, `event/*`, `project/*`, `profile/*`, `sections/*`
- primitive controls: `ui/*`

### Conventions

- Put reusable primitives in `components/ui/`; keep feature composition here.
- Let components call hooks and server actions, but keep database mutation logic in `lib/actions/*`.
- Prefer reusing existing provider, search, theme, dialog, and sidebar wiring before introducing parallel wrappers.
- Match existing folder ownership: landing-page sections stay in `sections/`, dashboard chrome stays in `admin-panel/` or `layout/`.

### Anti-Patterns

- Do not import `admin-kit/src/components/*` into the root app.
- Do not add another button, input, or modal primitive here when `components/ui/` already owns it.
- Do not move route ownership out of `app/` just to share JSX.

## UI PRIMITIVES GUIDE

### Overview

`components/ui/` is the root shared UI layer. It contains Radix/shadcn-style primitives plus several large client widgets such as `submit-project-form.tsx`, `sidebar.tsx`, and `video-vibe-coding-manager.tsx`.

### Where To Look

- core primitives: `button.tsx`, `input.tsx`, `card.tsx`, `select.tsx`, `tabs.tsx`, `sheet.tsx`
- notifications: `sonner.tsx`, `toaster.tsx`
- sidebar system: `sidebar.tsx`, `hooks/use-mobile.tsx`
- large domain widgets: `submit-project-form.tsx`, `video-vibe-coding-manager.tsx`, `profile-edit-dialog.tsx`

### Conventions

- Build on the existing Radix + CVA + Tailwind patterns already used in this folder.
- Reuse existing primitives before adding new wrappers.
- Client widgets should call `lib/actions/*` for mutations instead of embedding DB access.
- Keep image/upload flows aligned with existing progressive/upload helpers instead of inventing a second pattern.
- Sidebar state already uses a `sidebar_state` cookie and `SidebarProvider`; follow that path for sidebar work.

### Anti-Patterns

- Do not import UI primitives from `admin-kit/` into the root app.
- Do not grow the existing large files indefinitely; extract sections/helpers instead.
- Do not put server secrets, Supabase admin clients, or direct service-role logic in client components.

## LIBRARY GUIDE

### Overview

`lib/` is the root utility layer: Supabase clients, server auth, env parsing, SEO helpers, upload flows, URL/slug helpers, AI integrations, constants, and non-mutating data helpers.

### Where To Look

- Supabase clients: `lib/supabase/{client,server,admin,middleware}.ts`
- server auth helpers: `lib/server/auth.ts`
- env parsing: `lib/env-config.ts`
- SEO/site URL: `lib/seo/site-url.ts`
- URL + slug logic: `lib/project-url.ts`, `lib/slug.ts`
- uploads/images: `lib/uploadthing*.ts`, `lib/image-utils.ts`, `lib/favicon-utils.ts`
- server mutations: `lib/actions/*`

### Conventions

- Keep shared helpers here; move mutations into `lib/actions/*`.
- Reuse the existing client, server, and admin Supabase split instead of creating ad hoc clients.
- Prefer `getUser()`-based server validation patterns already documented in `lib/server/auth.ts` and `hooks/useAuth.ts`.
- Read env values through `env-config.ts`; keep URL and slug normalization centralized.

### Anti-Patterns

- Do not duplicate Supabase setup, env parsing, site URL logic, slug generation, or project URL normalization.
- Do not spread the `as any` session shim pattern from `lib/server/auth.ts`; prefer direct typed helpers when touching auth code.
- Do not add app-specific JSX here unless the file is already intentionally view-adjacent.

## SERVER ACTIONS GUIDE

### Overview

`lib/actions/` is the mutation layer for the root app. Files here already use `'use server'`, zod validation, Supabase access, ownership and role checks, Uploadthing cleanup, and path revalidation.

### Where To Look

- project submit, edit, and delete: `projects.ts`
- event submit and moderation: `events.ts`
- blog, comments, analytics, and user flows: `blog.ts`, `comments.ts`, `analytics.ts`, `user.ts`
- admin mutations: `admin/*`
- legacy large action file: `../actions.ts`

### Conventions

- Start every action file with `'use server'`.
- Validate external input before writes; existing files use zod and explicit field-error maps.
- Use `createClient()` for user-scoped writes and `createAdminClient()` only when bypassing RLS is intentional.
- Revalidate affected routes or tags after successful mutations.
- Prefer adding new work to the split domain files here instead of extending the legacy `lib/actions.ts` monolith.
- Keep return shapes explicit: success flag, error message, and field errors when relevant.

### Anti-Patterns

- Do not move mutations into client components or route components.
- Do not skip ownership or role checks for destructive or admin actions.
- Do not forget Uploadthing cleanup when replacing provisional or existing files.
- Do not trust raw `FormData` values without normalization.

## DOCUMENTATION GUIDE

### Overview

`docs/` is the repo knowledge base for database work, deployment, migrations, testing, legal, architecture, reviews, and dated plans.

### Where To Look

- index: `docs/README.md`
- database decisions: `docs/database/*`
- deployment and runbook: `docs/deployment/*`
- migration history and verification: `docs/migrations/*`
- testing notes: `docs/testing/*`
- dated implementation and design plans: `docs/plans/*`
- security references: `docs/security/*`

### Conventions

- Keep docs in the correct category; do not dump everything into `plans/`.
- Use kebab-case filenames; `docs/README.md` already documents that convention.
- When adding or removing docs, update `docs/README.md` in the same change.
- Keep app-facing legal or operational docs aligned with the corresponding code paths and pages.
- Treat dated plan docs as historical context unless newer code or newer plans supersede them.

### Anti-Patterns

- Do not treat `%TEMP%` or imported third-party docs as repo policy.
- Do not leave stale `AGENTS.md` links in `docs/README.md`.
- Do not record destructive DB or deployment guidance without rollback and verification notes nearby.

## SCRIPTS AND MIGRATIONS GUIDE

### Overview

`scripts/` is mostly ordered SQL migrations plus a few repo scripts such as `lint-changed.mjs` and destructive maintenance helpers.

### Where To Look

- schema bootstrap: `01_create_tables.sql`
- RLS and policy hardening: `08_*` through `20_*`
- blog and image cleanup migrations: `12_*` through `15_*`
- lint helper: `lint-changed.mjs`
- destructive helpers: `clear_database.js`, `production-reset.sql`

### Conventions

- Preserve numeric migration ordering; append new migrations instead of renumbering old ones.
- Keep SQL changes narrow and review the related docs in `docs/database/*` or `docs/migrations/*` before changing historical assumptions.
- Treat RLS, indexes, and foreign keys as first-class concerns; many scripts in this folder exist only to tighten those areas.
- Root linting for changed files runs through `node scripts/lint-changed.mjs`.

### Anti-Patterns

- Do not casually run `production-reset.sql` or `clear_database.js`.
- Do not rename or reorder historical migrations after they have meaning in the sequence.
- Do not remove indexes just because they look unused; check the database docs first.

## ADMIN-KIT GUIDE

### Overview

`admin-kit/` is a separate Next.js 15 package. It does not follow the root Bun + Biome workflow; it uses pnpm, ESLint, Prettier, Tailwind v4, and its own `src/`-scoped aliasing.

### Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run lint
pnpm run format
pnpm run format:fix
pnpm run lint:fix
```

### Where To Look

- package and tooling: `package.json`, `eslint.config.mjs`, `.prettierrc`, `tsconfig.json`, `next.config.ts`
- route tree: `src/app/*`
- local UI layer: `src/components/ui/*`
- local dashboard chrome: `src/components/layout/*`

### Conventions

- Use pnpm in this subtree.
- Use ESLint + Prettier here; root Biome rules do not apply.
- Respect the local alias mapping `@/* -> ./src/*`.
- Keep `admin-kit` components isolated from root `components/` and `components/ui/`.
- This package ships with template or demo-style data and layouts; verify real integrations before connecting it to production systems.

### Anti-Patterns

- Do not import root app components into this package.
- Do not assume root commands, root lockfile rules, or Bun-specific workflows apply here.
- Do not mix the root UI layer with `admin-kit/src/components/ui/*`.

## NOTES

- Root test config points at `tests/unit`, `tests/integration`, and `tests/e2e`; verify actual test files exist in the current checkout before claiming coverage.
- Keep `docs/README.md` aligned with this root `AGENTS.md`.
