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
