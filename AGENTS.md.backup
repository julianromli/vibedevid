# Repository Guidelines

Read WARP.md first — it is the project’s living knowledge base. This guide aligns with it for day‑to‑day contributions.

## Project Structure & Module Organization

- `app/`: App Router (Next.js 15). Key routes: `[username]/`, `project/[slug]/`, `project/submit/`, `user/auth/`.
- `components/`: Reusable UI components organized by purpose:
  - `components/ui/`: Base UI components (shadcn/ui + Radix). Components in PascalCase. Includes `ClientThemeProvider` for hydration-safe theme management.
  - `components/sections/`: Page section components (hero, project showcase, FAQ, etc.). Modular, self-contained sections for better maintainability.
- `hooks/`: React custom hooks (`useX` pattern) for reusable logic (auth, filters, animations, etc.).
- `types/`: TypeScript type definitions organized by domain (homepage, projects, users, etc.).
- `lib/`: Utilities and server actions (`actions.ts`, `slug.ts`, `categories.ts`, etc.).
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

### Authentication State Detection in Navbar (✅ Implemented)

**Pattern**: Every page that imports Navbar must implement authentication state detection to properly show login/logout status.

**Required Implementation**:
```typescript
// 1. Import Supabase client
import { createClient } from '@/lib/supabase/client'

// 2. Add auth state in component
const [isLoggedIn, setIsLoggedIn] = useState(false)
const [user, setUser] = useState<{
  id?: string
  name: string
  email: string
  avatar?: string
  avatar_url?: string
  username?: string
} | null>(null)

// 3. Add useEffect for auth check
useEffect(() => {
  let isMounted = true
  
  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!isMounted) return
      
      if (session?.user) {
        setIsLoggedIn(true)
        
        // Get user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        if (profile && isMounted) {
          const userData = {
            id: profile.id,
            name: profile.display_name,
            email: session.user.email || '',
            avatar_url: profile.avatar_url || '/vibedev-guest-avatar.png',
            username: profile.username,
          }
          setUser(userData)
        }
      } else {
        setIsLoggedIn(false)
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      if (isMounted) {
        setIsLoggedIn(false)
        setUser(null)
      }
    }
  }
  
  checkAuth()
  
  // Listen for auth changes
  const supabase = createClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!isMounted) return
    
    if (event === 'SIGNED_OUT' || !session) {
      setIsLoggedIn(false)
      setUser(null)
    } else if (event === 'SIGNED_IN' && session?.user) {
      checkAuth()
    }
  })
  
  return () => {
    isMounted = false
    subscription.unsubscribe()
  }
}, [])

// 4. Pass props to Navbar
<Navbar 
  isLoggedIn={isLoggedIn}
  user={user ?? undefined}
  // ... other props
/>
```

**Why This Pattern**:
- Ensures navbar consistently shows correct login/logout state across all pages
- Handles real-time auth state changes via Supabase auth listeners
- Prevents memory leaks with proper cleanup and `isMounted` checks
- Follows consistent data fetching pattern used in `app/page.tsx` and `app/[username]/page.tsx`

**Pages Implementing This Pattern**:
- `app/page.tsx` ✅
- `app/[username]/page.tsx` ✅  
- `app/ai/ranking/page.tsx` ✅
- `app/project/list/page.tsx` (needs implementation)
- `app/project/[slug]/page.tsx` (needs implementation)

**Files Modified**:
- `app/ai/ranking/page.tsx` (added auth detection pattern)
- `components/ui/navbar.tsx` (already supports auth props)

### UI/UX Button Readability Improvements (✅ Implemented)

**Issue**: "Lihat Project & Event" button on homepage had poor readability in dark mode due to low contrast between outline variant button styling and dark background.

**Root Cause**: `variant="outline"` buttons in dark mode use subtle border styling with low-contrast text, making them difficult to read against dark backgrounds.

**Solution**: Changed button variant from `outline` to `secondary` for better contrast and readability:
- `secondary` variant provides better background contrast in both light and dark modes
- Maintains visual hierarchy while improving accessibility
- Consistent with other secondary action buttons across the platform

**Files Modified**:
- `app/page.tsx` (updated button variant from outline to secondary)

**Benefits**:
- Improved readability in dark mode
- Better accessibility compliance
- Enhanced user experience for secondary actions

### Homepage Modular Architecture (✅ Refactored 2025-01-10)

**Achievement**: Successfully refactored `app/page.tsx` from monolithic 1511-line component to modular 259-line architecture - **83% reduction** in main file size.

**Problem**: The original homepage was a single massive component that:
- Mixed concerns (auth, data fetching, UI rendering, state management)
- Made testing and debugging difficult
- Violated Single Responsibility Principle
- Created maintenance bottlenecks
- Duplicated logic across pages

**Solution**: Extracted into modular architecture with clear separation of concerns:

#### 1. Custom Hooks (`hooks/`)
Centralized reusable logic:
- **`useAuth.ts`**: Authentication state management with profile creation
  - Handles session detection, user profile fetching, and auth state changes
  - Implements proper cleanup to prevent memory leaks
  - Used across multiple pages requiring auth detection
  
- **`useProjectFilters.ts`**: Project filtering and sorting logic
  - Manages filter state (category, trending/top/newest)
  - Fetches projects with dynamic sorting via `fetchProjectsWithSorting`
  - Handles loading states and pagination
  
- **`useIntersectionObserver.ts`**: Scroll animation triggers
  - Observes sections entering viewport
  - Triggers animations at appropriate scroll positions
  
- **`useFAQ.ts`**: FAQ accordion state management
  - Simple toggle logic for FAQ items

#### 2. Section Components (`components/sections/`)
Self-contained page sections:
- **`hero-section.tsx`**: Hero with animated title, CTA buttons, Safari mockup, framework tooltips
- **`project-showcase.tsx`**: Filterable project grid with load more functionality
- **`ai-tools-section.tsx`**: AI tools integration showcase
- **`reviews-section.tsx`**: Testimonials display with columns
- **`faq-section.tsx`**: FAQ accordion with JSON-LD schema for SEO
- **`cta-section.tsx`**: Call-to-action section with floating card animations

#### 3. Shared UI Components (`components/ui/`)
Reusable building blocks:
- **`safari-mockup.tsx`**: Browser chrome mockup (extracted from inline component)
- **`integration-card.tsx`**: Tool integration card component
- **`filter-controls.tsx`**: Dropdown filter controls for project filtering

#### 4. Type Definitions (`types/homepage.ts`)
Centralized TypeScript interfaces:
```typescript
export interface User { id, name, email, avatar, username }
export interface Project { id, slug, title, image, category, author, likes, views, createdAt }
export interface Testimonial { text, image, name, role }
export interface Framework { id, name, designation, image }
export interface FAQ { question, answer }
export type SortBy = 'trending' | 'top' | 'newest'
```

#### Benefits Achieved

**Maintainability**:
- Each section is isolated and independently modifiable
- Clear file organization by purpose
- Easier onboarding for new developers

**Reusability**:
- Hooks can be used across multiple pages
- UI components are self-contained and portable
- Type definitions ensure consistency

**Testability**:
- Components can be unit tested in isolation
- Hooks can be tested independently
- Mocking dependencies is straightforward

**Performance**:
- Better code splitting opportunities
- Reduced initial bundle size
- Lazy loading already implemented for heavy components

**Developer Experience**:
- Faster file navigation
- Clearer code organization
- Easier debugging with smaller, focused components

#### Usage Pattern

**New page structure:**
```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import { HeroSection } from '@/components/sections/hero-section'
import { ProjectShowcase } from '@/components/sections/project-showcase'
// ... other section imports

export default function HomePage() {
  const auth = useAuth()
  const projectFilters = useProjectFilters(auth.authReady)
  
  return (
    <div>
      <Navbar {...auth} />
      <HeroSection {...auth} handleJoinWithUs={...} />
      <ProjectShowcase {...projectFilters} />
      {/* ... other sections */}
    </div>
  )
}
```

#### Files Modified/Created
- ✅ `app/page.tsx` - Refactored (1511 → 259 lines)
- ✅ `app/page.backup.tsx` - Original backup
- ✅ `components/sections/*` - 6 new section components
- ✅ `components/ui/*` - 3 new shared UI components  
- ✅ `hooks/*` - 4 new custom hooks
- ✅ `types/homepage.ts` - Type definitions

**Preserved**:
- All user-facing functionality
- Authentication flows
- Project filtering & sorting
- Animations & interactions
- SEO (JSON-LD schemas)
- Accessibility attributes
- Mobile responsiveness

**Best Practice for Future Pages**:
When creating new pages or refactoring existing ones:
1. Extract reusable logic into custom hooks
2. Break large components into section components
3. Create shared UI components for repeated patterns
4. Define TypeScript types in `types/` directory
5. Keep main page files under 300 lines
6. Follow naming conventions: `kebab-case.tsx` for files, `PascalCase` for exports
