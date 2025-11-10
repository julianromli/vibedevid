# VibeDev ID - AI Agent Guidelines (Root)

## Project Snapshot
- **Type**: Single Next.js 15 application (not a monorepo)
- **Stack**: Next.js 15 + React 19 + TypeScript + Tailwind v4 + Supabase
- **Architecture**: App Router with modular components, custom hooks, server actions
- **Note**: Sub-directories have detailed AGENTS.md files - read the closest one to your working file

## Root Setup Commands
```bash
# Install dependencies
pnpm install

# Development server (with Turbopack)
pnpm dev

# Build for production
pnpm build

# Type checking (CRITICAL: build ignores TS errors)
pnpm exec tsc --noEmit

# Linting
pnpm lint

# E2E tests (Playwright)
npx playwright test
```

## Universal Conventions

**Code Style**:
- TypeScript strict mode enabled
- 2-space indentation (Prettier enforced)
- ESLint: `next/core-web-vitals` + `next/typescript` + `prettier`
- Tailwind utility-first CSS (Prettier plugin sorts classes)

**Naming Conventions**:
- Components: `PascalCase` (e.g., `HeroSection.tsx`)
- Hooks: `useX` pattern (e.g., `useAuth.ts`)
- Utilities: `camelCase` (e.g., `slug.ts`)
- Route files: `kebab-case` or `page.tsx` (Next.js convention)
- Types: `PascalCase` interfaces (e.g., `User`, `Project`)

**Import Aliases**:
- Use `@/` for absolute imports (e.g., `import { createClient } from '@/lib/supabase/client'`)

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
pnpm exec find components -name "*ComponentName*"

# Find a hook
pnpm exec find hooks -name "use*"

# Find a route handler
pnpm exec find app -name "page.tsx" -o -name "route.ts"

# Find server actions
pnpm exec find lib -name "actions.ts"

# Search for a function/variable across codebase
# Note: ripgrep (rg) is not installed, use findstr on Windows
findstr /s /i "functionName" *.ts *.tsx

# Find all TypeScript files with errors
pnpm exec tsc --noEmit
```

### Project Documentation
- **Main guide**: [WARP.md](WARP.md) - Living knowledge base (READ THIS FIRST)
- **Security**: [SECURITY.md](SECURITY.md)
- **Deployment**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Testing**: [TESTING_SLUG_MIGRATION.md](TESTING_SLUG_MIGRATION.md)

## Definition of Done

Before considering a task complete:
- [ ] TypeScript compiles without errors (`pnpm exec tsc --noEmit`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] Relevant tests pass (`npx playwright test` if touching user flows)
- [ ] No secrets committed (check `.env.local` usage)
- [ ] Changes documented if needed (update WARP.md for major patterns)
- [ ] Git commit follows Conventional Commits format
