# Lib - AI Agent Guidelines

## Package Identity
Server utilities, actions, and helper functions for VibeDev ID. Contains Supabase client setup, server actions, and reusable utility functions.

**Primary tech**: TypeScript, Supabase (client & server), Next.js Server Actions

## Setup & Run
```bash
# No separate setup - lib is part of main app
# Test by running dev server from root:
cd ../
pnpm dev
```

## Patterns & Conventions

### File Organization
```
lib/
├── supabase/           # Supabase client configurations
│   ├── client.ts           # Client-side Supabase client
│   ├── server.ts           # Server-side Supabase client
│   └── middleware.ts       # Middleware for auth
├── actions.ts          # Next.js Server Actions (main data operations)
├── slug.ts             # Slug generation and validation
├── categories.ts       # Project category definitions
├── avatar-utils.ts     # Avatar image processing
├── image-utils.ts      # General image utilities
├── youtube-utils.ts    # YouTube video parsing
├── favicon-utils.ts    # Favicon fetching
├── client-analytics.ts # Client-side analytics tracking
├── client-likes.ts     # Client-side like functionality
├── env-config.ts       # Environment variable validation
├── uploadthing.ts      # UploadThing configuration
└── utils.ts            # Miscellaneous utilities (cn, etc.)
```

### Naming Rules
- **File names**: `kebab-case.ts` (e.g., `client-analytics.ts`)
- **Functions**: `camelCase` (e.g., `fetchProjects`, `generateSlug`)
- **Server Actions**: Mark with `'use server'` directive
- **Client functions**: Mark with `'use client'` directive if needed

### Supabase Client Patterns

#### ✅ DO: Client-Side Supabase Client
```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Usage in client components:
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()
  // Use supabase.from('table').select()...
}
```
**Example**: [`lib/supabase/client.ts`](supabase/client.ts)

#### ✅ DO: Server-Side Supabase Client
```tsx
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Usage in Server Actions or Server Components:
import { createClient } from '@/lib/supabase/server'

export async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select()
  return <div>{data.map(...)}</div>
}
```
**Example**: [`lib/supabase/server.ts`](supabase/server.ts)

### Server Action Patterns

#### ✅ DO: Server Actions with Error Handling
```tsx
// lib/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Insert data
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: formData.get('title'),
        author_id: user.id,
        // ... other fields
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Revalidate cache
    revalidatePath('/project/list')
    
    return { success: true, data }
  } catch (error) {
    console.error('Create project error:', error)
    return { success: false, error: 'Failed to create project' }
  }
}
```
**Pattern**: See all server actions in [`lib/actions.ts`](actions.ts)

#### ✅ DO: Slug Generation with Uniqueness Check
```tsx
// lib/slug.ts
import { createClient } from '@/lib/supabase/server'

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  const supabase = await createClient()
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const { data } = await supabase
      .from('projects')
      .select('slug')
      .eq('slug', slug)
      .single()
    
    if (!data) break  // Slug is unique
    
    slug = `${baseSlug}-${counter++}`
  }
  
  return slug
}
```
**Example**: [`lib/slug.ts`](slug.ts)

#### ✅ DO: Client-Side Analytics Tracking
```tsx
// lib/client-analytics.ts
'use client'

import { createClient } from '@/lib/supabase/client'

export async function trackView(projectId: string, sessionId: string) {
  try {
    const supabase = createClient()
    
    await supabase.from('views').insert({
      project_id: projectId,
      session_id: sessionId,
      viewed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Track view error:', error)
    // Fail silently - don't break user experience
  }
}
```
**Example**: [`lib/client-analytics.ts`](client-analytics.ts)

#### ❌ DON'T: Mix Client and Server Code
```tsx
// ❌ BAD: Mixing client and server
'use server'

export async function badAction() {
  const supabase = createClient()  // Which client? Client or server?
  // This is ambiguous and error-prone
}

// ✅ GOOD: Explicit server action
'use server'

import { createClient } from '@/lib/supabase/server'

export async function goodAction() {
  const supabase = await createClient()  // Clear: server client
  // ...
}
```

#### ❌ DON'T: Expose Service Role Key Client-Side
```tsx
// ❌ BAD: Never use service role key in client code
'use client'

const supabase = createClient(url, SERVICE_ROLE_KEY)  // DANGER!

// ✅ GOOD: Use anon key for client, service role only in server
'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Server-side only
)
```

### Utility Function Patterns

#### ✅ DO: Tailwind Class Merging
```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage:
<Button className={cn('base-classes', variant && 'variant-classes', className)} />
```
**Example**: [`lib/utils.ts`](utils.ts)

#### ✅ DO: Image Processing Utilities
```tsx
// lib/image-utils.ts
export async function optimizeImage(file: File): Promise<Blob> {
  // Resize, compress, convert format
  // Return optimized blob
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}
```
**Example**: [`lib/image-utils.ts`](image-utils.ts)

## Touch Points / Key Files

**Supabase Integration**:
- Client-side: [`supabase/client.ts`](supabase/client.ts)
- Server-side: [`supabase/server.ts`](supabase/server.ts)
- Middleware: [`supabase/middleware.ts`](supabase/middleware.ts)

**Server Actions**:
- Main actions: [`actions.ts`](actions.ts) - All CRUD operations
- Slug handling: [`slug.ts`](slug.ts)

**Client-Side Utilities**:
- Analytics: [`client-analytics.ts`](client-analytics.ts)
- Likes: [`client-likes.ts`](client-likes.ts)

**Image Processing**:
- Avatars: [`avatar-utils.ts`](avatar-utils.ts)
- General images: [`image-utils.ts`](image-utils.ts)
- YouTube thumbnails: [`youtube-utils.ts`](youtube-utils.ts)
- Favicons: [`favicon-utils.ts`](favicon-utils.ts)

**Configuration**:
- Categories: [`categories.ts`](categories.ts)
- Environment: [`env-config.ts`](env-config.ts)
- UploadThing: [`uploadthing.ts`](uploadthing.ts)

## JIT Index Hints

```bash
# Find all server actions
findstr /s /i "'use server'" lib\*.ts

# Find all client-side functions
findstr /s /i "'use client'" lib\*.ts

# Find Supabase queries
findstr /s /i ".from(" lib\*.ts

# Find all utility functions
pnpm exec find lib -name "*-utils.ts"

# Search for a specific function
findstr /s /i "functionName" lib\*.ts
```

## Common Gotchas

- **Server vs Client**: Always use correct Supabase client (`lib/supabase/server.ts` vs `lib/supabase/client.ts`)
- **Auth in Server Actions**: Always check `await supabase.auth.getUser()` before mutations
- **Revalidation**: Call `revalidatePath()` or `revalidateTag()` after data mutations
- **Error handling**: Server Actions should return `{ success, data, error }` objects, not throw
- **Service Role Key**: NEVER expose in client code, only use server-side for admin operations
- **Environment variables**: `NEXT_PUBLIC_*` for client, no prefix for server-only
- **Slug generation**: Always check uniqueness before inserting (see `slug.ts`)
- **Analytics**: Fail silently on tracking errors (don't break user experience)

## Server Action Checklist

Before creating a new server action:
- [ ] File starts with `'use server'` directive
- [ ] Uses `await createClient()` from `@/lib/supabase/server`
- [ ] Checks authentication with `await supabase.auth.getUser()`
- [ ] Validates input data (Zod schema recommended)
- [ ] Handles errors gracefully (try/catch)
- [ ] Returns structured response `{ success, data, error }`
- [ ] Calls `revalidatePath()` for cache invalidation if needed
- [ ] Logs errors for debugging (but never log sensitive data)

## Type Checking

```bash
# Run from project root
cd ../
pnpm exec tsc --noEmit
```
