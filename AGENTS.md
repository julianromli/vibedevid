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

# Linting & Formatting
bun lint
bun format

# E2E tests (Playwright) - runs all tests in tests/ directory
bunx playwright test

# Run single test file
bunx playwright test tests/views-tracking.spec.ts

# Run single test by name
bunx playwright test -g "should track views when visiting project page"

# Run tests in headed mode (see browser)
bunx playwright test --headed

# Run tests in specific browser
bunx playwright test --project=chromium
```

## Universal Conventions

**Code Style**:

- TypeScript strict mode enabled
- 2-space indentation, no semicolons, single quotes (Biome enforced)
- Biome: Unified linter + formatter (replaces ESLint + Prettier)
- Tailwind utility-first CSS (Biome's `useSortedClasses` auto-sorts classes)
- Unused vars allowed (Biome rule disabled for both JS and TS)

**Imports**:

- Use `@/` prefix for absolute imports (e.g., `import { createClient } from '@/lib/supabase/client'`)
- Group imports: React → Third-party → Internal (@/)
- Named exports preferred over default exports (except Next.js pages/layouts)

**Types**:

- Explicit types for function params and returns
- Use `interface` for object shapes, `type` for unions/intersections
- No `any` - use `unknown` and type guards if needed

**Naming**:

- Components: `PascalCase` (e.g., `HeroSection.tsx`)
- Hooks: `use` prefix (e.g., `useAuth.ts`)
- Utils: `camelCase` (e.g., `slug.ts`)
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

**Branch Strategy**:

- Main branch: `main`
- Work directly or use feature branches as needed

## Security & Secrets

- **Never commit secrets**: `.env.local` is gitignored
- **Environment variables**: See `.env.example` for required vars
- **Supabase keys**: Use `NEXT_PUBLIC_*` for client-side, `SUPABASE_SERVICE_ROLE_KEY` for server-side
- **Auth whitelist**: Email domain restrictions enforced (do not expand without review)
- **PII handling**: Never log sensitive user data

## JIT Index - Directory Map

### Package Structure

- **Components**: `components/` → [see components/AGENTS.md](components/AGENTS.md)
- **Hooks**: `hooks/` → [see hooks/AGENTS.md](hooks/AGENTS.md)
- **Server utilities**: `lib/` → [see lib/AGENTS.md](lib/AGENTS.md)
- **App routes**: `app/` → [see app/AGENTS.md](app/AGENTS.md)
- **E2E tests**: `tests/` → [see tests/AGENTS.md](tests/AGENTS.md)
- **Database migrations**: `scripts/` → [see scripts/AGENTS.md](scripts/AGENTS.md)

### Quick Find Commands

```bash
# Find a component by name
bunx find components -name "*ComponentName*"

# Find a hook
bunx find hooks -name "use*"

# Find a route handler
bunx find app -name "page.tsx" -o -name "route.ts"

# Find server actions
bunx find lib -name "actions.ts"

# Search for a function/variable across codebase
# Note: ripgrep (rg) is not installed, use findstr on Windows
findstr /s /i "functionName" *.ts *.tsx

# Find all TypeScript files with errors
bun tsc --noEmit
```

### Project Documentation

- **Docs Index**: [docs/README.md](docs/README.md) - All documentation
- **Main guide**: [WARP.md](WARP.md) - Living knowledge base (READ THIS FIRST)
- **Design System**: [docs/design-system.md](docs/design-system.md) - Colors, typography, components
- **Security**: [SECURITY.md](SECURITY.md)
- **Deployment**: [docs/deployment/vercel.md](docs/deployment/vercel.md)
- **Database**: [docs/database/](docs/database/) - Optimization & indexing docs
- **Migrations**: [docs/migrations/](docs/migrations/) - Migration guides

## Definition of Done

Before considering a task complete:

- [ ] TypeScript compiles without errors (`bun tsc --noEmit`)
- [ ] Biome passes (`bun lint`)
- [ ] Code formatted (`bun format`)
- [ ] Relevant tests pass (`bunx playwright test` if touching user flows)
- [ ] No secrets committed (check `.env.local` usage)
- [ ] Changes documented if needed (update WARP.md for major patterns)
- [ ] Git commit follows Conventional Commits format
