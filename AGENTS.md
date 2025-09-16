# Repository Guidelines

Read WARP.md first — it is the project’s living knowledge base. This guide aligns with it for day‑to‑day contributions.

## Project Structure & Module Organization

- `app/`: App Router (Next.js 15). Key routes: `[username]/`, `project/[slug]/`, `project/submit/`, `user/auth/`.
- `components/` and `components/ui/`: Reusable UI (shadcn/ui + Radix). Components in PascalCase. Includes `ClientThemeProvider` for hydration-safe theme management.
- `hooks/`: React hooks (`useX` pattern). `lib/`: utilities and server actions (`actions.ts`, `slug.ts`).
- `styles/`: Tailwind v4 globals and tokens. `public/`: static assets. `tests/`: Playwright specs.
- `scripts/`: SQL migrations and helpers (`01_create_tables.sql` … `06_enhance_views_table.sql`, `clear_database.js`).

## Build, Test, and Development Commands

- Preferred: `pnpm dev | build | start | lint | vercel-build`.
- Alternatives: `npm run dev|build|start|lint|vercel-build`. One‑time: `npx playwright install`.
- Tests: `npx playwright test` (uses `playwright.config.ts`). Dev server at `http://localhost:3000`.

## Coding Style & Naming Conventions

- TypeScript + React; 2‑space indent; logical import grouping. Tailwind utility‑first; keep class lists readable.
- Naming: Components `PascalCase`, hooks `useX`, utilities `camelCase`, route segments/files `kebab-case`.
- Routing: Use slug‑based URLs for projects (`project/[slug]`); avoid leaking numeric/UUID ids in UI.

## Testing Guidelines

- Framework: Playwright. Place tests in `tests/` as `*.spec.ts`.
- Focus on stable selectors (data‑testids), verify legacy UUID → slug redirects, and session‑based analytics flows.
- Run: `npx playwright test` (after `npx playwright install`).

## Commit & Pull Request Guidelines

- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`). Emojis optional. Keep scope small and imperative.
- PRs: Describe changes, link issues, add screenshots for UI, include testing steps. Ensure lint and tests pass locally.
- Keep `.env.example` updated with any new config; document DB changes under `scripts/`. Reference WARP.md when touching auth, slugs, or analytics.

## Security & Configuration Tips

- Env vars (see WARP.md and `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`.
- Follow the email‑domain whitelist policy in auth; do not expand domains without review.
- Do not commit secrets. Use Next Image domains from `next.config.mjs`.

## Known Issues & Solutions

### Theme Toggle Hydration Mismatch (✅ Resolved)

**Issue**: Theme toggle button in navbar didn't work due to hydration mismatch between server and client rendering of `next-themes` ThemeProvider.

**Root Cause**: Server-side rendering (SSR) generates different HTML than client-side due to theme state differences, causing React hydration warnings and preventing theme switching functionality.

**Solution**: Created `components/client-theme-provider.tsx` with client-side mounting strategy:
- Uses `useState` and `useEffect` to ensure ThemeProvider only renders after client mount
- Shows loading state during initial render to prevent hydration mismatch
- Applied `suppressHydrationWarning` to `<body>` in `app/layout.tsx` for expected theme-related mismatches

**Files Modified**:
- `components/client-theme-provider.tsx` (new)
- `app/layout.tsx` (updated to use ClientThemeProvider)

This approach is preferred over simply adding `suppressHydrationWarning` everywhere as it addresses the root cause rather than masking symptoms.
