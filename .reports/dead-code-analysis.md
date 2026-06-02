# Dead Code Analysis Report

**Generated**: June 2, 2026  
**Project**: VibeDev ID (root app only; admin-kit excluded)  
**Analysis Tools**: knip 6.15.0, depcheck 1.4.7, manual grep, TypeScript compiler

---

## Baseline (pre-cleanup)

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `bunx tsc --noEmit` | PASS (0 errors) |
| Unit tests | `bun run test` | PASS (10 tests, 6 files) |
| Build | `npm run build` | PASS (client + server) |
| Lint | `bun run lint:all` | FAIL (449 errors, pre-existing; mostly admin-kit) |

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Tier 1 SAFE files (Next.js orphans) | 18 | Verified zero runtime imports |
| Tier 1 SAFE files (orphan scripts) | 4 | `patch_*.js` one-off scripts |
| Tier 1 SAFE dependencies | 3 | `@lobehub/icons`, `geist`, `country-region-data` |
| Tier 2 CAUTION (knip unused files) | ~120+ | Many false positives from lazy `import('@/app/...')` |
| Tier 3 DANGER | — | lib/actions pairs, Supabase, migrations — skip |

---

## 1. Tier 1 — SAFE to Delete (verified)

### Legacy Next.js artifacts (Hono migration complete)

| File | Reason |
|------|--------|
| `next.config.mjs` | `next` not in package.json |
| `proxy.ts` | Next middleware; no callers |
| `i18n/request.ts` | Only referenced by next.config.mjs |
| `app/robots.ts`, `app/sitemap.ts` | Served by `src/server/routes/seo.ts` |
| `app/layout.tsx`, `app/page.tsx` | SPA uses `src/client/layouts/RootLayout.tsx` |
| `app/auth/callback/route.ts` | Handled by `src/server/routes/auth-callback.ts` |
| `app/api/**` (10 files) | Duplicated by `src/server/routes/api.ts` |

### Orphan maintenance scripts

| File | Reason |
|------|--------|
| `patch_category.js` | No imports/references |
| `patch_form.js` | No imports/references |
| `patch_test.js` | No imports/references |
| `patch_test_2.js` | No imports/references |

### Unused dependencies (root app)

| Package | Reason | Tier |
|---------|--------|------|
| `@lobehub/icons` | Components use unpkg CDN URLs | SAFE |
| `geist` | No TS/TSX imports | SAFE |
| `country-region-data` | Only used in admin-kit | SAFE |

---

## 2. Depcheck — false positives / keep

| Package | Action | Reason |
|---------|--------|--------|
| `@hono/node-server` | KEEP | Used in server build (depcheck misses Vite SSR entry) |
| `@hono/zod-validator` | KEEP | Used in `src/server/routes/*` |
| `@tailwindcss/postcss` | KEEP | PostCSS/Tailwind build |
| `@tailwindcss/typography` | KEEP | Tailwind plugin |
| `tailwindcss-animate` | KEEP | Tailwind plugin |
| `postcss` | KEEP | Build dependency |
| `@testing-library/user-event` | CAUTION | May be used in future e2e/unit tests |

### Depcheck missing deps (from dead Next.js files — resolve by deletion)

| Package | Source | Action |
|---------|--------|--------|
| `next`, `next-intl`, `@next/bundle-analyzer` | next.config.mjs, proxy.ts | Delete source files |
| `@vercel/analytics`, `@vercel/speed-insights` | app/layout.tsx | Delete source file |

---

## 3. Knip — CAUTION items (do not bulk-delete)

Knip reported 144 unused files; most are **false positives** because:

- Lazy routes in `src/client/router.tsx` use dynamic `import('@/app/...')`
- Server modules imported only from `src/server/app.ts` chain
- Compat shims resolved via Vite aliases (`next/*`, `next-intl`)

**Confirmed used despite knip flag:** `src/server/**`, `src/client/compat/**`, most `app/**` page clients, `lib/seo/*`, `hooks/*`.

**Investigate individually** before deleting any knip-flagged component/lib file.

---

## 4. Prior cleanup (Jan 2026) — already completed

- 8 demo/backup/component files removed
- 9 unused dependencies removed
- Do not re-delete items from that report

---

## Execution Log

_(Updated during June 2026 cleanup run)_

### Phase 0 — Baseline

| Check | Result |
|-------|--------|
| `bunx tsc --noEmit` | PASS (0 errors) |
| `bun run test` | PASS (10 tests) |
| `npm run build` | PASS |
| `bun run lint:all` | FAIL (449 errors, pre-existing admin-kit) |

### Phase 1 — Tooling added

- `knip` + `depcheck` devDependencies
- [`knip.json`](knip.json) with Vite/Hono entry points
- Scripts: `analyze:dead-code`, `analyze:deps`

### Phase 2–3 — Tier 1 deletions (22 files)

- `next.config.mjs`, `proxy.ts`, `i18n/request.ts`
- `app/robots.ts`, `app/sitemap.ts`, `app/layout.tsx`, `app/page.tsx`
- `app/auth/callback/route.ts`
- `app/api/**` (10 route files)
- `patch_category.js`, `patch_form.js`, `patch_test.js`, `patch_test_2.js`

### Phase 4 — Dependencies removed (3)

- `@lobehub/icons`, `geist`, `country-region-data`

### Phase 5 — Caution sweep (38 files)

Confirmed unused in root app (admin-kit has separate copies where applicable):

- **Config/lib/hooks:** `config/site.ts`, `lib/client-analytics.ts`, `lib/supabase/middleware.ts`, `hooks/useFAQ.ts`, `hooks/useProgressiveImage.ts`, `public/sw.js`
- **Blog legacy:** `rich-text-editor.tsx`, `editor-image-uploader.tsx`, `novel-generative-menu.tsx`
- **Template duplicates:** `components/layout/**` (7 files), `components/errors/**` (5 files), `back-button.tsx`, `confirm-dialog.tsx`, `calendar-date-picker.tsx`, date/copy/search helpers (6 files)
- **Unused UI:** `heart-button.tsx`, `progressive-avatar.tsx`, `progressive-hero-image.tsx`, `animated-tooltip.tsx`, `motion-wrapper.tsx`, `tools-columns.tsx`, `typography.tsx`, `upload-dropzone.tsx`

**Fix applied:** `components/command-menu.tsx` import redirected to `@/components/admin-panel/data/sidebar-data` after removing duplicate layout data.

### Skipped (intentionally)

- Remaining `app/**` page clients (lazy-loaded via React Router)
- `lib/actions/*.ts` / `*.client.ts` pairs
- `app/not-found.tsx` + `components/ui/empty.tsx` (not routed yet, kept for future)
- `admin-kit/**` (excluded per scope)
- Build deps flagged by depcheck: `@tailwindcss/*`, `postcss`, `tailwindcss-animate`
- Runtime deps depcheck missed: `@hono/node-server`, `@hono/zod-validator`

### Final verification

| Check | Result |
|-------|--------|
| `bunx tsc --noEmit` | PASS |
| `bun run test` | PASS |
| `npm run build` | PASS |

```text
Dead Code Cleanup
----------------------------
Deleted:   60 files
           3 dependencies
Skipped:   ~120 knip false-positives + DANGER tier items
Saved:     ~120 KB source (~15 KB client bundle gzip delta on index chunk)
Verification: tsc PASS / vitest PASS / build PASS
Residual:  app/not-found.tsx, remaining app/** clients, admin-kit
----------------------------
```

### Phase 6 — Follow-up (June 2, 2026)

**Architecture migration:** Moved 39 files from `app/` → `src/client/{pages,features,layouts,styles}/`. Deleted entire `app/` directory (~35 orphaned Next.js route shells).

**404 route:** Added `src/client/pages/NotFoundPage.tsx`; router `*` catch-all and reserved username segments render it.

**CI:** Non-blocking `analyze:dead-code` step in `.github/workflows/lint.yml`.

**Lint:** `admin-kit/**` excluded via `biome.json` `experimentalScannerIgnores`. Root `lint:ci` still warns on pre-existing root issues (422 warnings).

**README:** Updated test commands; removed stale `tests/views-tracking.spec.ts` reference.

**Post-migration verification:**

| Check | Result |
|-------|--------|
| `bunx tsc --noEmit` | PASS |
| `bun run test` | PASS |
| `npm run build` | PASS |
| `bun run analyze:dead-code` | 51 unused files (mostly knip false-positives: compat shims, server entry chain) |
| `bun run lint:ci` | FAIL (422 pre-existing root warnings; admin-kit excluded) |
