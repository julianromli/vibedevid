# VibeDev ID - AI Agent Guidelines (Root)

## Project Snapshot

- **Type**: Single Next.js 16 application (not a monorepo)
- **Stack**: Next.js 16 + React 19 + TypeScript + Tailwind v4 + Supabase
- **Architecture**: App Router with modular components, custom hooks, server actions
- **Note**: Sub-directories have detailed AGENTS.md files - read the closest one to your working file

## Commands

```bash
# Install dependencies
bun install

# Development server (Turbopack is default in Next.js 16)
bun dev

# Build for production
bun build

# Type checking (CRITICAL: build ignores TS errors via ignoreBuildErrors: true)
bun tsc --noEmit

# Linting & Formatting (Biome)
# Fast lint (changed files only, local dev)
bun lint

# Fast lint alias
bun run lint:fast

# Full lint (all files)
bun run lint:all

# Strict lint for CI (fails on warnings)
bun run lint:ci

# Format all supported files
bun format

# E2E tests (Playwright) - runs all tests in tests/ directory
bunx playwright test

# Run single test file
bunx playwright test tests/views-tracking.spec.ts

# Run single test by name
bunx playwright test -g "should track views when visiting project page"

# Run unit tests only
bunx playwright test tests/unit/

# Run tests in headed mode (see browser)
bunx playwright test --headed

# Run tests in debug mode (step through)
bunx playwright test --debug

# Run tests in specific browser
bunx playwright test --project=chromium
```

## Universal Conventions

**Code Style**:

- TypeScript strict mode enabled
- 2-space indentation, no semicolons, single quotes (Biome enforced)
- Biome: Unified linter + formatter (replaces ESLint + Prettier)
- Tailwind utility-first CSS (`useSortedClasses` is intentionally disabled to reduce lint noise)
- Line width: 120 characters max

**Imports**:

- Use `@/` prefix for absolute imports (e.g., `import { createClient } from '@/lib/supabase/client'`)
- Group imports: React -> Third-party -> Internal (@/)
- Named exports preferred over default exports (except Next.js pages/layouts)

**Types**:

- Explicit types for function params and returns
- Use `interface` for object shapes, `type` for unions/intersections
- No `any` - use `unknown` and type guards if needed

**Naming**:

- Components: `PascalCase` (e.g., `HeroSection.tsx`)
- Hooks: `use` prefix (e.g., `useAuth.ts`)
- Utils/lib: `camelCase` (e.g., `slug.ts`)
- Constants: `UPPER_SNAKE_CASE`
- Files: Match export name or Next.js convention (`page.tsx`, `route.ts`)

**Error Handling**:

- Server actions: Return `{ success: boolean, error?: string }` objects
- Client code: Use try-catch with toast notifications (via `sonner`)
- Supabase errors: Check `error` object, provide user-friendly messages

**Commit Format**:

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Keep scope small and imperative mood
- Examples: `feat: add user profile page`, `fix: resolve theme hydration issue`

**Branch Strategy**: Main branch is `main`. Work directly or use feature branches.

## Security & Secrets

- **Never commit secrets**: `.env.local` is gitignored
- **Environment variables**: See `.env.example` for required vars
- **Supabase keys**: Use `NEXT_PUBLIC_*` for client-side, `SUPABASE_SERVICE_ROLE_KEY` for server-side
- **Auth whitelist**: Email domain restrictions enforced (do not expand without review)
- **PII handling**: Never log sensitive user data

## Directory Map

| Directory | Purpose | Details |
|-----------|---------|---------|
| `components/` | React UI components | [components/AGENTS.md](components/AGENTS.md) |
| `hooks/` | Custom React hooks | [hooks/AGENTS.md](hooks/AGENTS.md) |
| `lib/` | Server utilities, actions | [lib/AGENTS.md](lib/AGENTS.md) |
| `app/` | Next.js App Router routes | [app/AGENTS.md](app/AGENTS.md) |
| `tests/` | Playwright E2E tests | [tests/AGENTS.md](tests/AGENTS.md) |
| `scripts/` | Database migrations | [scripts/AGENTS.md](scripts/AGENTS.md) |

**Key Documentation**:
- [AGENTS.md](AGENTS.md) - Living knowledge base (READ THIS FIRST)
- [docs/design-system.md](docs/design-system.md) - Colors, typography, components
- [docs/security/RLS_POLICIES.md](docs/security/RLS_POLICIES.md) - Row Level Security policies and best practices
- [docs/security/AUTH_DASHBOARD_SETTINGS.md](docs/security/AUTH_DASHBOARD_SETTINGS.md) - Supabase Auth configuration checklist
- [docs/security/SECURITY_AUDIT_SUMMARY.md](docs/security/SECURITY_AUDIT_SUMMARY.md) - Security audit implementation (2026-02-03)
- [docs/README.md](docs/README.md) - All documentation index

## i18n (Internationalization) Best Practices

**Architecture**: Use `useTranslations` from 'next-intl' directly. Do NOT create custom wrapper hooks - they create maintenance burden by duplicating translation sources.

**Provider Setup**:
- `NextIntlClientProvider` MUST wrap all children in `app/layout.tsx` to enable client-side translations
- This bridges server-side request configuration to client components

**Component Patterns**:
- Components using `useTranslations` require `'use client'` directive even if they appear server-side
- Use `t.raw('key')` for arrays (hero titles, testimonials) - use `t('key')` for strings
- Keep translation keys hierarchical: `section.subsection.key`
- Always update BOTH `messages/en.json` and `messages/id.json` simultaneously

**Common Pitfalls**:
- Hardcoded text hides easily in section components - use code review to catch incomplete i18n
- The `useSafeTranslations` custom hook was removed (anti-pattern) - use next-intl native
- Type checking will show pre-existing errors - verify errors are from your changes before fixing
- **Missing NextIntlClientProvider** causes "Failed to call useTranslations context not found" error

**Tool Constraints**:
- Morph edit has 30s timeout - use standard edit tool for files >100 lines
- When updating >5 files, delegate to CoderAgent subagent for efficiency

## Unified Patterns

### Comments System

Comments are **centralized** - one component and one set of server actions for both Blog and Project.

| Resource | Location |
|----------|----------|
| Component | `components/ui/comment-section.tsx` |
| Types | `types/comments.ts` |
| Actions | `lib/actions/comments.ts` |

**Usage**:
```tsx
import { CommentSection } from '@/components/ui/comment-section'
import { getComments } from '@/lib/actions/comments'

// Fetch: 'post' for Blog, 'project' for Project
const { comments } = await getComments('post', postId)

// Render
<CommentSection
  entityType="post"
  entityId={id}
  initialComments={comments}
  isLoggedIn={!!user}
  currentUser={{ id, name, avatar }}
  allowGuest={false}
/>
```

### Authentication Security

- **Server-Side**: MUST use `supabase.auth.getUser()` to validate sessions. `getSession()` is insecure on server as it blindly trusts cookies.
- **Client-Side**: `useAuth` hook uses `getSession()` for speed but listens to `onAuthStateChange`.
- **Legacy Compat**: `getServerSession` (`lib/server/auth.ts`) wraps `getUser()` but returns `{ user }` to match legacy structure.

## Definition of Done

Before considering a task complete:

- [ ] TypeScript compiles without errors (`bun tsc --noEmit`)
- [ ] Fast local lint passes (`bun lint`)
- [ ] Full or strict lint passes when needed (`bun run lint:all` locally or `bun run lint:ci` in CI)
- [ ] Code formatted (`bun format`)
- [ ] Relevant tests pass (`bunx playwright test` if touching user flows)
- [ ] No secrets committed (check `.env.local` usage)
- [ ] Changes documented if needed (update AGENTS.md for major patterns)
- [ ] Git commit follows Conventional Commits format
