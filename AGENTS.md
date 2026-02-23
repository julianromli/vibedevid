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

<!-- NEXT-AGENTS-MD-START -->[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-cache-components.mdx,07-fetching-data.mdx,08-updating-data.mdx,09-caching-and-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,prefetching.mdx,production-checklist.mdx,progressive-web-apps.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route-segment-config.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,browserDebugInfoInTerminal.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,isolatedDevBuild.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-report-web-vitals.mdx,use-router.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,isolatedDevBuild.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}<!-- NEXT-AGENTS-MD-END -->
