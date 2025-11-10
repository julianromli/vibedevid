# Hooks - AI Agent Guidelines

## Package Identity
Custom React hooks for reusable stateful logic across VibeDev ID application.

**Primary tech**: React 19 hooks API, TypeScript, Supabase client

## Setup & Run
```bash
# Hooks are part of main app - no separate setup
# Test hooks by running dev server from root:
cd ../
pnpm dev
```

## Patterns & Conventions

### File Organization
```
hooks/
├── useAuth.ts                    # Authentication state management
├── useProjectFilters.ts          # Project filtering and sorting
├── useIntersectionObserver.ts    # Scroll animations
├── useFAQ.ts                     # FAQ accordion state
├── useProgressiveImage.ts        # Progressive image loading
└── use-media-query.ts            # Responsive breakpoint detection
```

### Naming Rules
- **File names**: `useX.ts` or `use-x.ts` (kebab-case for multi-word)
- **Hook function**: `useX` (camelCase, must start with `use`)
- **Return type**: Explicit interface or inferred object

### Hook Patterns

#### ✅ DO: Authentication Hook (`useAuth`)
Centralized auth state management with cleanup:
```tsx
// hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/homepage'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile && isMounted) {
            setIsLoggedIn(true)
            setUser({
              id: profile.id,
              name: profile.display_name,
              email: session.user.email || '',
              avatar_url: profile.avatar_url || '/vibedev-guest-avatar.png',
              username: profile.username,
            })
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        if (isMounted) setAuthReady(true)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (isMounted) checkAuth()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { isLoggedIn, user, authReady }
}
```
**Example**: [`hooks/useAuth.ts`](useAuth.ts)

#### ✅ DO: Data Fetching with Dependencies
```tsx
// hooks/useProjectFilters.ts
export function useProjectFilters(authReady: boolean) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState<SortBy>('trending')

  useEffect(() => {
    if (!authReady) return  // Wait for auth before fetching

    const loadProjects = async () => {
      setLoading(true)
      const data = await fetchProjectsWithSorting(sortBy, category)
      setProjects(data)
      setLoading(false)
    }

    loadProjects()
  }, [authReady, sortBy, category])

  return { projects, loading, category, setCategory, sortBy, setSortBy }
}
```
**Example**: [`hooks/useProjectFilters.ts`](useProjectFilters.ts)

#### ✅ DO: Intersection Observer Hook
```tsx
// hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [elementRef, options])

  return isVisible
}
```
**Example**: [`hooks/useIntersectionObserver.ts`](useIntersectionObserver.ts)

#### ✅ DO: Simple State Management Hook
```tsx
// hooks/useFAQ.ts
export function useFAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return { openItems, toggleItem }
}
```
**Example**: [`hooks/useFAQ.ts`](useFAQ.ts)

#### ❌ DON'T: Forget Cleanup
```tsx
// ❌ BAD: Memory leak - no cleanup
export function useBadSubscription() {
  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange(...)
    // Missing cleanup!
  }, [])
}

// ✅ GOOD: Proper cleanup
export function useGoodSubscription() {
  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange(...)
    return () => subscription.unsubscribe()
  }, [])
}
```

#### ❌ DON'T: Race Conditions
```tsx
// ❌ BAD: Race condition
export function useBadAsync() {
  const [data, setData] = useState()
  
  useEffect(() => {
    fetchData().then(setData)  // What if component unmounts?
  }, [])
}

// ✅ GOOD: Prevent race conditions
export function useGoodAsync() {
  const [data, setData] = useState()
  
  useEffect(() => {
    let isMounted = true
    
    fetchData().then((result) => {
      if (isMounted) setData(result)
    })
    
    return () => { isMounted = false }
  }, [])
}
```

### Hook Categories

**Auth & User State**:
- `useAuth.ts` - Authentication state, session management, profile fetching

**Data Fetching**:
- `useProjectFilters.ts` - Project filtering, sorting, pagination
- Custom hooks should depend on `authReady` state before fetching

**UI State**:
- `useFAQ.ts` - FAQ accordion state
- `use-media-query.ts` - Responsive breakpoint detection

**Performance**:
- `useIntersectionObserver.ts` - Lazy loading, scroll animations
- `useProgressiveImage.ts` - Progressive image loading with blur-up

## Touch Points / Key Files

**Must-read hooks**:
- Authentication pattern: [`useAuth.ts`](useAuth.ts)
- Data fetching pattern: [`useProjectFilters.ts`](useProjectFilters.ts)
- Cleanup pattern: All hooks demonstrate proper cleanup

**Integration examples**:
- Auth usage: `app/page.tsx`, `app/[username]/page.tsx`
- Project filters: `components/sections/project-showcase.tsx`
- Intersection observer: `components/sections/cta-section.tsx`

## JIT Index Hints

```bash
# Find all hooks
pnpm exec find hooks -name "*.ts"

# Find hook usage in components
findstr /s /i "useAuth" components\*.tsx app\*.tsx

# Find hooks using Supabase
findstr /s /i "createClient" hooks\*.ts

# Find hooks with useEffect cleanup
findstr /s /i "return () =>" hooks\*.ts
```

## Common Gotchas

- **Always cleanup**: Return cleanup function from `useEffect` for subscriptions, timers, observers
- **Race conditions**: Use `isMounted` flag for async operations to prevent state updates on unmounted components
- **Dependencies**: Always include all dependencies in `useEffect` dependency array (ESLint will warn)
- **Auth dependency**: Data fetching hooks should wait for `authReady` before making requests
- **Client-only**: Hooks only work in client components (`'use client'` directive)
- **Hook rules**: Don't call hooks conditionally or in loops (React rules of hooks)

## Pre-Hook Checklist

Before creating a new hook:
- [ ] Is this logic reused in multiple components? (If not, keep it local)
- [ ] Does it need cleanup? (subscriptions, timers, observers)
- [ ] Does it need auth state? (depend on `useAuth` or `authReady`)
- [ ] Are all dependencies included in `useEffect` arrays?
- [ ] Does it handle race conditions with `isMounted` flag?
- [ ] Is the return type explicitly typed or clearly inferred?

## Type Checking

```bash
# Run from project root
cd ../
pnpm exec tsc --noEmit
```
