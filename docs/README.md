# VibeDev ID - Documentation

Dokumentasi teknis dan operasional untuk project VibeDev ID.

---

## Quick Links

| Document                            | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| [Design System](./design-system.md) | Color palette, typography, components, spacing |
| [WARP.md](../WARP.md)               | Living knowledge base (main reference)         |
| [SECURITY.md](../SECURITY.md)       | Security guidelines & practices                |

---

## Documentation Structure

### Database

Dokumentasi terkait database schema, optimization, dan indexing.

- [Optimization Plan](./database/optimization-plan.md) - Database fix & optimization plan
- [Index Analysis](./database/index-analysis.md) - Database index analysis
- [Optimization Summary](./database/optimization-summary.md) - Summary of optimizations

### Deployment

Panduan deployment dan release management.

- [Vercel Deployment](./deployment/vercel.md) - Vercel deployment guide
- [Rollout & Rollback](./deployment/rollout-rollback.md) - Release rollout & rollback procedures

### Migrations

Dokumentasi migrasi database dan breaking changes.

- [Slug Migration](./migrations/slug-migration.md) - UUID to slug migration guide
- [Verification Report](./migrations/verification-report.md) - Migration verification report

### Plans

Dated implementation and design plans.

- [Landing Page UI Guidelines Fix Plan](./plans/2026-04-02-landing-page-ui-guidelines-fixes.md) - Homepage accessibility, motion, and URL-state fix plan

### Testing

Testing guides dan checklists.

- [Production Checklist](./testing/checklist.md) - Production verification checklist
- [Playwright Setup](./testing/playwright.md) - Playwright MCP setup guide
- [Avatar Test](./testing/avatar-test.md) - Avatar auto-delete test documentation

### Legal

Dokumen legal dan kebijakan.

- [Terms & Conditions](./legal/terms-and-conditions.md) - Terms of service

---

## AI Agent Documentation

Untuk AI agents (Claude, Cursor, dll), lihat:

- [`AGENTS.md`](../AGENTS.md) - Root level repo guidance
- [`app/AGENTS.md`](../app/AGENTS.md) - App Router routes, layouts, and API handlers
- [`app/(admin)/AGENTS.md`](../app/%28admin%29/AGENTS.md) - Protected admin dashboard subtree
- [`components/AGENTS.md`](../components/AGENTS.md) - Feature/shared component guidance
- [`components/ui/AGENTS.md`](../components/ui/AGENTS.md) - Shared UI primitives and large widgets
- [`lib/AGENTS.md`](../lib/AGENTS.md) - Utility, auth, Supabase, SEO, and upload helpers
- [`lib/actions/AGENTS.md`](../lib/actions/AGENTS.md) - Server action and mutation rules
- [`docs/AGENTS.md`](./AGENTS.md) - Documentation organization rules
- [`scripts/AGENTS.md`](../scripts/AGENTS.md) - SQL migration and script rules
- [`admin-kit/AGENTS.md`](../admin-kit/AGENTS.md) - Separate Next.js 15 subproject rules
- [`orchestrator/AGENTS.md`](../orchestrator/AGENTS.md) - Orchestration docs/config guidance

---

## Contributing to Docs

1. Gunakan Markdown format
2. Simpan di folder yang sesuai kategorinya
3. Update index ini jika menambah dokumen baru
4. Follow naming convention: `kebab-case.md`
