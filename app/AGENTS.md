# App - AI Agent Guidelines

## Package Identity
Next.js 15 App Router directory containing all routes, layouts, and page components for VibeDev ID.

**Primary tech**: Next.js 15 App Router, React Server Components, TypeScript

## Setup & Run
```bash
# Run from project root
cd ../
pnpm dev          # Development with Turbopack
pnpm build        # Production build
pnpm start        # Production server
```

## Patterns & Conventions

### File Organization (App Router)
```
app/
├── layout.tsx              # Root layout (applies to all pages)
├── page.tsx                # Homepage (/)
├── globals.css             # Global Tailwind styles
├── font.ts                 # Font configurations
├── [username]/             # Dynamic user profile route
│   └── page.tsx                # /[username]
├── project/
│   ├── [slug]/                 # Dynamic project detail route
│   │   └── page.tsx                # /project/[slug]
│   ├── list/
│   │   └── page.tsx                # /project/list
│   └── submit/
│       └── page.tsx                # /project/submit
├── user/
│   └── auth/
│       ├── callback/               # OAuth callback
│       │   └── route.ts
│       └── login/
│           └── page.tsx            # /user/auth/login
├── ai/
│   └── ranking/
│       └── page.tsx                # /ai/ranking
├── admin/                  # Admin routes
├── api/                    # API routes
└── ...other routes
```

### Naming Rules
- **Folders**: `kebab-case` for route segments (e.g., `user-profile/`)
- **Special files**: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`
- **Dynamic routes**: `[param]/` for dynamic segments (e.g., `[username]/`, `[slug]/`)
- **Route groups**: `(group)/` for organization without affecting URL (e.g., `(auth)/`)

### Route Patterns

#### ✅ DO: Homepage with Auth Detection
```tsx
// app/page.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import { Navbar } from '@/components/ui/navbar'
import { HeroSection } from '@/components/sections/hero-section'
import { ProjectShowcase } from '@/components/sections/project-showcase'

export default function HomePage() {
  const auth = useAuth()
  const projectFilters = useProjectFilters(auth.authReady)

  return (
    <div>
      <Navbar isLoggedIn={auth.isLoggedIn} user={auth.user} />
      <HeroSection {...auth} handleJoinWithUs={...} />
      <ProjectShowcase {...projectFilters} />
    </div>
  )
}
```
**Example**: [`app/page.tsx`](page.tsx)

#### ✅ DO: Dynamic Route with Slug
```tsx
// app/project/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Try to find project by slug
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()
  
  // Handle legacy UUID redirect
  if (!project && isValidUUID(slug)) {
    const { data: legacyProject } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', slug)
      .single()
    
    if (legacyProject?.slug) {
      redirect(`/project/${legacyProject.slug}`)
    }
  }
  
  if (!project) notFound()
  
  return <div>{project.title}</div>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Fetch project data and return metadata
}
```
**Pattern**: Slug-based routing with UUID fallback (see WARP.md)

#### ✅ DO: Root Layout with Theme Provider
```tsx
// app/layout.tsx
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientThemeProvider>
          {children}
          <Toaster />
        </ClientThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: 'VibeDev ID',
  description: '...',
}
```
**Example**: [`app/layout.tsx`](layout.tsx)

#### ✅ DO: API Route Handler
```tsx
// app/api/projects/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const supabase = await createClient()
    let query = supabase.from('projects').select('*')
    
    if (category) {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
```

#### ✅ DO: OAuth Callback Route
```tsx
// app/user/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/user/auth/login`)
}
```
**Pattern**: See OAuth callback in `app/user/auth/callback/route.ts`

#### ❌ DON'T: Fetch Data in Client Components
```tsx
// ❌ BAD: Client-side data fetching in page
'use client'

export default function BadPage() {
  const [data, setData] = useState()
  
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  
  return <div>{data?.title}</div>
}

// ✅ GOOD: Server Component (default in App Router)
import { createClient } from '@/lib/supabase/server'

export default async function GoodPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select()
  
  return <div>{data[0].title}</div>
}
```

#### ❌ DON'T: Mix Auth Detection Patterns
```tsx
// ❌ BAD: Inconsistent auth detection
'use client'

export default function BadPage() {
  const [user, setUser] = useState()
  
  useEffect(() => {
    // Custom auth logic duplicated in each page
    const supabase = createClient()
    supabase.auth.getSession().then(...)
  }, [])
}

// ✅ GOOD: Use centralized hook
'use client'

import { useAuth } from '@/hooks/useAuth'

export default function GoodPage() {
  const { isLoggedIn, user, authReady } = useAuth()
  // Consistent auth state across all pages
}
```

### Route Categories

**Public Routes**:
- `/` - Homepage (app/page.tsx)
- `/[username]` - User profile (app/[username]/page.tsx)
- `/project/[slug]` - Project detail (app/project/[slug]/page.tsx)
- `/project/list` - Project list (app/project/list/page.tsx)
- `/ai/ranking` - AI ranking page (app/ai/ranking/page.tsx)

**Auth-Required Routes**:
- `/project/submit` - Submit project (requires login)
- `/admin/*` - Admin pages (requires admin role)

**Auth Routes**:
- `/user/auth/login` - Login page
- `/user/auth/callback` - OAuth callback (route handler)

**API Routes**:
- `/api/*` - API endpoints (route.ts files)

## Touch Points / Key Files

**Core Pages**:
- Homepage: [`page.tsx`](page.tsx)
- Root layout: [`layout.tsx`](layout.tsx)
- User profile: [`[username]/page.tsx`]([username]/page.tsx)
- Project detail: [`project/[slug]/page.tsx`](project/[slug]/page.tsx)

**Auth Flow**:
- Login page: [`user/auth/login/page.tsx`](user/auth/login/page.tsx)
- OAuth callback: [`user/auth/callback/route.ts`](user/auth/callback/route.ts)

**Styles**:
- Global CSS: [`globals.css`](globals.css)
- Font config: [`font.ts`](font.ts)

## JIT Index Hints

```bash
# Find all pages
pnpm exec find app -name "page.tsx"

# Find all layouts
pnpm exec find app -name "layout.tsx"

# Find all API routes
pnpm exec find app -name "route.ts"

# Find dynamic routes
pnpm exec find app -name "[*"

# Search for component usage
findstr /s /i "ComponentName" app\*.tsx

# Find pages using a hook
findstr /s /i "useAuth" app\*.tsx
```

## Common Gotchas

- **Server Components by default**: Pages are Server Components unless you add `'use client'`
- **Async params**: In Next.js 15, `params` and `searchParams` are promises - must `await`
- **Auth detection**: Always use `useAuth` hook in client components for consistent auth state
- **Slug routing**: Implement UUID → slug redirects for backward compatibility (see WARP.md)
- **suppressHydrationWarning**: Required on `<html>` and `<body>` for theme provider
- **Metadata**: Use `generateMetadata` for dynamic pages, export `metadata` for static pages
- **Loading states**: Create `loading.tsx` for automatic loading UI during navigation
- **Error handling**: Create `error.tsx` for error boundaries
- **Navbar auth**: Every page with Navbar must pass auth state (`isLoggedIn`, `user`)

## Page Checklist

Before creating a new page:
- [ ] Decide: Server Component (default) or Client Component (`'use client'`)?
- [ ] If client component with Navbar: Implement auth detection with `useAuth`
- [ ] If dynamic route: Handle params as promise (`await params`)
- [ ] Add metadata (SEO): `export const metadata` or `export async function generateMetadata`
- [ ] Add loading state: Create `loading.tsx` if needed
- [ ] Add error boundary: Create `error.tsx` if needed
- [ ] Test navigation: Verify links work correctly
- [ ] Test auth: Verify auth-required routes redirect to login

## Pre-Page Deployment Checks

```bash
# Type check
cd ../
pnpm exec tsc --noEmit

# Build test (catches most routing issues)
pnpm build

# Lint
pnpm lint

# E2E tests (if touching critical flows)
npx playwright test
```
