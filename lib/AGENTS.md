# Lib - AI Agent Guidelines

## Package Identity

Server utilities, actions, and helper functions for VibeDev ID. Contains Supabase client setup, server actions, and reusable utility functions.

**Primary tech**: TypeScript, Supabase (client & server), Next.js Server Actions

## Setup & Run

```bash
# No separate setup - lib is part of main app
# Test by running dev server from root:
cd ../
bun dev
```

## Patterns & Conventions

### File Organization

```
lib/
├── supabase/                    # Supabase client configurations
│   ├── client.ts                # Client-side Supabase client
│   ├── server.ts                # Server-side Supabase client
│   ├── middleware.ts            # Middleware for auth
│   └── admin.ts                 # Admin client (service role)
├── actions/                     # Server actions by feature
│   ├── blog.ts                  # Blog post actions
│   └── comments.ts              # ⭐ Unified comment actions (Blog + Project)
├── constants/                   # Constant definitions
│   └── faqs.ts                  # FAQ data
├── server/                      # Server utilities
│   ├── auth.ts                  # Auth utilities
│   └── utils.ts                 # Server-side utils
├── actions.ts                   # Main server actions (legacy)
├── ai-leaderboard-data.ts       # AI leaderboard data
├── avatar-utils.ts              # Avatar image processing
├── categories.ts                # Project category definitions
├── client-analytics.ts          # Client-side analytics tracking
├── client-likes.ts              # Client-side like functionality
├── env-config.ts                # Environment variable validation
├── favicon-utils.ts             # Favicon fetching
├── image-utils.ts               # General image utilities
├── slug.ts                      # Slug generation and validation
├── uploadthing.ts               # UploadThing configuration
└── utils.ts                     # Miscellaneous utilities (cn, etc.)
```

### Naming Rules

- **File names**: `kebab-case.ts` (e.g., `client-analytics.ts`)
- **Functions**: `camelCase` (e.g., `fetchProjects`, `generateSlug`)
- **Server Actions**: Mark with `'use server'` directive
- **Client functions**: Mark with `'use client'` directive if needed
- **Directories**: `kebab-case` for subdirectories

### Supabase Client Patterns

#### ✅ DO: Client-Side Supabase Client

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Usage in client components:
;('use client')
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

#### ✅ DO: Admin Client (Service Role)

```tsx
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin access only
  )
}

// Usage: Only in server actions that need admin privileges
// Never expose in client code
```

**Example**: [`lib/supabase/admin.ts`](supabase/admin.ts)

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
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

#### ✅ DO: Blog Actions

```tsx
// lib/actions/blog.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBlogPost(formData: FormData) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: formData.get('title'),
        content: formData.get('content'),
        author_id: user.id,
        slug: formData.get('slug'),
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/blog')

    return { success: true, data }
  } catch (error) {
    console.error('Create blog post error:', error)
    return { success: false, error: 'Failed to create blog post' }
  }
}

export async function updateBlogPost(id: string, formData: FormData) {
  // Similar pattern for update
}

export async function deleteBlogPost(id: string) {
  // Similar pattern for delete
}
```

**Example**: [`lib/actions/blog.ts`](actions/blog.ts)

#### ✅ DO: Comment Actions (Unified)

```tsx
// lib/actions/comments.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateCommentInput, CommentResult, GetCommentsResult } from '@/types/comments'

// Create comment for both Blog and Project
export async function createComment(input: CreateCommentInput): Promise<CommentResult> {
  const { entityType, entityId, content, guestName } = input
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  // Build insert data based on entity type
  const insertData = {
    content: content.trim(),
    user_id: authData.user?.id ?? null,
    ...(entityType === 'post' ? { post_id: entityId } : { project_id: entityId }),
    ...(!authData.user && guestName ? { author_name: guestName.trim() } : {}),
  }

  const { error } = await supabase.from('comments').insert(insertData)
  if (error) return { success: false, error: 'Failed to add comment' }

  revalidatePath(entityType === 'post' ? '/blog' : '/project')
  return { success: true }
}

// Get comments for Blog or Project
export async function getComments(
  entityType: 'post' | 'project',
  entityId: string
): Promise<GetCommentsResult> {
  const supabase = await createClient()
  const filterColumn = entityType === 'post' ? 'post_id' : 'project_id'

  const { data, error } = await supabase
    .from('comments')
    .select(`id, content, created_at, user_id, author_name, users(id, display_name, avatar_url, role)`)
    .eq(filterColumn, entityId)
    .order('created_at', { ascending: false })

  if (error) return { comments: [], error: 'Failed to load comments' }
  return { comments: normalizeComments(data) }
}

// Report comment for moderation
export async function reportComment(commentId: string, reason: string): Promise<CommentResult> {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) return { success: false, error: 'Login required' }

  const { error } = await supabase.from('comment_reports').insert({
    comment_id: commentId,
    reporter_id: authData.user.id,
    reason: reason.trim(),
  })

  if (error) return { success: false, error: 'Failed to report' }
  return { success: true }
}
```

**Example**: [`lib/actions/comments.ts`](actions/comments.ts)

#### ⭐ Comment Actions - Key Points

| Function | Purpose | Entity Support |
|----------|---------|----------------|
| `createComment()` | Create new comment | Blog (`post`) + Project (`project`) |
| `getComments()` | Fetch comments with user info | Blog (`post`) + Project (`project`) |
| `reportComment()` | Report inappropriate comment | Both (requires login) |

**Usage Pattern**:

```tsx
// In Server Component (page.tsx)
import { getComments } from '@/lib/actions/comments'

// For Blog post
const { comments } = await getComments('post', postId)

// For Project
const { comments } = await getComments('project', projectId)
```

> **Note**: Legacy `addComment()` and `getComments()` functions in `lib/actions.ts` have been removed.
> Always use `@/lib/actions/comments` for all comment operations.

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

    if (!data) break // Slug is unique

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

#### ✅ DO: Client-Side Likes

```tsx
// lib/client-likes.ts
'use client'

import { createClient } from '@/lib/supabase/client'

export async function toggleLike(projectId: string, userId: string) {
  try {
    const supabase = createClient()

    // Check if already liked
    const { data: existing } = await supabase
      .from('likes')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Unlike
      await supabase.from('likes').delete().eq('id', existing.id)
      return { liked: false }
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({ project_id: projectId, user_id: userId })
      return { liked: true }
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return { liked: false, error: 'Failed to toggle like' }
  }
}
```

**Example**: [`lib/client-likes.ts`](client-likes.ts)

#### ❌ DON'T: Mix Client and Server Code

```tsx
// ❌ BAD: Mixing client and server
'use server'

export async function badAction() {
  const supabase = createClient() // Which client? Client or server?
  // This is ambiguous and error-prone
}

// ✅ GOOD: Explicit server action
;('use server')

import { createClient } from '@/lib/supabase/server'

export async function goodAction() {
  const supabase = await createClient() // Clear: server client
  // ...
}
```

#### ❌ DON'T: Expose Service Role Key Client-Side

```tsx
// ❌ BAD: Never use service role key in client code
'use client'

const supabase = createClient(url, SERVICE_ROLE_KEY) // DANGER!

// ✅ GOOD: Use anon key for client, service role only in server
;('use server')

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
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
;<Button
  className={cn('base-classes', variant && 'variant-classes', className)}
/>
```

**Example**: [`lib/utils.ts`](utils.ts)

#### ✅ DO: Image Processing Utilities

```tsx
// lib/image-utils.ts
export async function optimizeImage(file: File): Promise<Blob> {
  // Resize, compress, convert format
  // Return optimized blob
}

export function getImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}
```

**Example**: [`lib/image-utils.ts`](image-utils.ts)

#### ✅ DO: AI Leaderboard Data

```tsx
// lib/ai-leaderboard-data.ts
export interface AITool {
  id: string
  name: string
  description: string
  category: string
  website: string
  logo: string
}

export const aiLeaderboardData: AITool[] = [
  // Leaderboard data
]
```

**Example**: [`lib/ai-leaderboard-data.ts`](ai-leaderboard-data.ts)

#### ✅ DO: Category Definitions

```tsx
// lib/categories.ts
export const PROJECT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design',
  'AI/ML',
  'Game Development',
  'DevOps',
  'Other',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]
```

**Example**: [`lib/categories.ts`](categories.ts)

#### ✅ DO: Constants

```tsx
// lib/constants/faqs.ts
export const FAQS = [
  {
    question: 'What is VibeDev ID?',
    answer: 'VibeDev ID is a community platform for developers in Indonesia.',
  },
  // More FAQs
]
```

**Example**: [`lib/constants/faqs.ts`](constants/faqs.ts)

#### ✅ DO: Server Utilities

```tsx
// lib/server/utils.ts
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(date))
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
```

**Example**: [`lib/server/utils.ts`](server/utils.ts)

## Touch Points / Key Files

**Supabase Integration**:

- Client-side: [`supabase/client.ts`](supabase/client.ts)
- Server-side: [`supabase/server.ts`](supabase/server.ts)
- Middleware: [`supabase/middleware.ts`](supabase/middleware.ts)
- Admin: [`supabase/admin.ts`](supabase/admin.ts)

**Server Actions**:

- Main actions: [`actions.ts`](actions.ts) - Core CRUD operations (projects, users, likes)
- Blog actions: [`actions/blog.ts`](actions/blog.ts)
- Comment actions: [`actions/comments.ts`](actions/comments.ts) ⭐ Unified for Blog + Project
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
- FAQs: [`constants/faqs.ts`](constants/faqs.ts)

**Data**:

- AI Leaderboard: [`ai-leaderboard-data.ts`](ai-leaderboard-data.ts)

**Server Utilities**:

- Auth utilities: [`server/auth.ts`](server/auth.ts)
- Server utils: [`server/utils.ts`](server/utils.ts)

## JIT Index Hints

```bash
# Find all server actions
findstr /s /i "'use server'" lib\*.ts lib\actions\*.ts

# Find all client-side functions
findstr /s /i "'use client'" lib\*.ts

# Find Supabase queries
findstr /s /i ".from(" lib\*.ts lib\actions\*.ts

# Find all utility functions
bunx find lib -name "*-utils.ts"

# Find server actions
bunx find lib/actions -name "*.ts"

# Find constants
bunx find lib/constants -name "*.ts"

# Search for a specific function
findstr /s /i "functionName" lib\*.ts lib\actions\*.ts
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
- **Blog actions**: Blog actions require proper authorization checks
- **Comments**: Use unified `@/lib/actions/comments` for both Blog and Project comments

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
bun tsc --noEmit
```
