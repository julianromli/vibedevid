# Blog Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a community blogging platform where any authenticated user can create, edit, and publish blog posts with drafts/scheduling, comments with reporting, and moderation dashboard for admins.

**Architecture:** Server-first Next.js App Router with Supabase backend. Existing `posts` table extended with new columns, new tables for tags and moderation. Tiptap for rich text editing. ISR for blog pages. Community-driven content with auto-publish + reporting moderation model.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL), Tiptap, UploadThing, Playwright, Vitest

---

## Phase 1: Database Schema

### Task 1: Add columns to existing posts table

**Files:**

- Modify: `scripts/` (new migration file)

**Step 1: Create migration file**

```sql
-- scripts/12_add_blog_columns.sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS read_time_minutes INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES post_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_published_cover ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_reports_status ON blog_reports(status);
```

**Step 2: Run migration in Supabase**

Run: Supabase SQL Editor or `supabase_apply_migration`
Expected: Success, tables created

**Step 3: Commit**

```bash
git add scripts/12_add_blog_columns.sql
git commit -m "feat: add blog schema columns and tables"
```

---

## Phase 2: Server Actions

### Task 2: Blog CRUD server actions

**Files:**

- Create: `lib/actions/blog.ts`

**Step 1: Write failing test**

```typescript
// tests/unit/blog-actions.spec.ts
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/lib/actions/blog'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

describe('blog actions', () => {
  it('createBlogPost returns error for short title', async () => {
    const result = await createBlogPost({ title: 'Hi', content: {} })
    expect(result.success).toBe(false)
    expect(result.error).toContain('5 characters')
  })

  it('createBlogPost returns error for empty content', async () => {
    const result = await createBlogPost({ title: 'Valid Title', content: {} })
    expect(result.success).toBe(false)
    expect(result.error).toContain('too short')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/unit/blog-actions.spec.ts -t "createBlogPost returns error"`
Expected: FAIL (action not defined)

**Step 3: Write minimal implementation**

```typescript
// lib/actions/blog.ts
'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/slug'

export async function createBlogPost(data: {
  title: string
  content: Record<string, any>
  excerpt?: string
  cover_image?: string
}) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!data.title || data.title.length < 5) {
    return { success: false, error: 'Title must be at least 5 characters' }
  }

  if (!data.content || JSON.stringify(data.content).length < 100) {
    return { success: false, error: 'Content is too short' }
  }

  const baseSlug = slugify(data.title)
  const { data: existing } = await supabase
    .from('posts')
    .select('slug')
    .like('slug', `${baseSlug}%`)

  let slug = baseSlug
  if (existing?.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const readTime = Math.ceil(
    JSON.stringify(data.content).split(' ').length / 200,
  )

  const { error } = await supabase.from('posts').insert({
    title: data.title,
    slug,
    content: data.content,
    excerpt: data.excerpt,
    cover_image: data.cover_image,
    author_id: authData.user.id,
    read_time_minutes: readTime,
    status: 'published',
    published_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }

  revalidatePath('/blog')
  return { success: true, slug }
}

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title: string
    content: Record<string, any>
    excerpt: string
    cover_image: string
  }>,
) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!post || post.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  const updateData: any = { ...data, updated_at: new Date().toISOString() }

  if (data.title) {
    updateData.slug = slugify(data.title)
  }

  if (data.content) {
    updateData.read_time_minutes = Math.ceil(
      JSON.stringify(data.content).split(' ').length / 200,
    )
  }

  const { error } = await supabase.from('posts').update(updateData).eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to update post' }
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${id}`)
  return { success: true }
}

export async function deleteBlogPost(id: string) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, status')
    .eq('id', id)
    .single()

  if (!post) {
    return { success: false, error: 'Post not found' }
  }

  const isAuthor = post.author_id === authData.user.id
  const isAdmin = authData.user.user_metadata.role === 0

  if (!isAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' }
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to delete post' }
  }

  revalidatePath('/blog')
  return { success: true }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/unit/blog-actions.spec.ts -t "createBlogPost returns error"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/actions/blog.ts tests/unit/blog-actions.spec.ts
git commit -m "feat: add blog CRUD server actions"
```

---

### Task 3: Comment and report server actions

**Files:**

- Create: `lib/actions/comments.ts`

**Step 1: Write failing test**

```typescript
// tests/unit/comment-actions.spec.ts
import { createComment, reportComment } from '@/lib/actions/comments'

describe('comment actions', () => {
  it('createComment returns error for empty content', async () => {
    const result = await createComment('post-id', '')
    expect(result.success).toBe(false)
  })

  it('reportComment creates a report', async () => {
    const result = await reportComment('comment-id', 'spam')
    expect(result.success).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/unit/comment-actions.spec.ts -t "createComment returns error"`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// lib/actions/comments.ts
'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function createComment(postId: string, content: string) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!content || content.trim().length < 2) {
    return { success: false, error: 'Comment too short' }
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: authData.user.id,
    content: content.trim(),
  })

  if (error) {
    return { success: false, error: 'Failed to add comment' }
  }

  revalidatePath(`/blog`)
  return { success: true }
}

export async function reportComment(commentId: string, reason: string) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase.from('blog_reports').insert({
    comment_id: commentId,
    reporter_id: authData.user.id,
    reason,
  })

  if (error) {
    return { success: false, error: 'Failed to report comment' }
  }

  return { success: true }
}

export async function getComments(postId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      content,
      created_at,
      user:users!comments_user_id_fkey(id, display_name, avatar_url)
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    return []
  }

  return data
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/unit/comment-actions.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/actions/comments.ts tests/unit/comment-actions.spec.ts
git commit -m "feat: add comment and report actions"
```

---

## Phase 3: Components

### Task 4: BlogCard component

**Files:**

- Create: `components/blog/blog-card.tsx`

**Step 1: Write failing test**

```typescript
// tests/components/blog-card.spec.tsx
import { render, screen } from '@testing-library/react'
import { BlogCard } from '@/components/blog/blog-card'

const mockPost = {
  id: '123',
  title: 'Building a Blog with Next.js',
  excerpt: 'Learn how to build a blog',
  cover_image: 'https://example.com/cover.jpg',
  published_at: '2025-12-20T10:00:00Z',
  read_time_minutes: 5,
  author: { display_name: 'John', avatar_url: null },
  tags: ['nextjs', 'react'],
}

describe('BlogCard', () => {
  it('renders post title and metadata', () => {
    render(<BlogCard post={mockPost} />)
    expect(screen.getByText('Building a Blog with Next.js')).toBeInTheDocument()
    expect(screen.getByText('5 min read')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/components/blog-card.spec.tsx`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// components/blog/blog-card.tsx
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BlogCardProps {
  post: {
    id: string
    title: string
    excerpt: string | null
    cover_image: string | null
    published_at: string | null
    read_time_minutes: number | null
    author: { display_name: string; avatar_url: string | null }
    tags?: string[]
  }
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group relative block overflow-hidden rounded-xl bg-card border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="aspect-[16/9] relative overflow-hidden">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No cover</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-3">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/20">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h3 className="font-serif text-xl md:text-2xl text-white mb-2 line-clamp-2">
            {post.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-white/80">
            {post.read_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.read_time_minutes} min read
              </span>
            )}
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(post.published_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      {post.excerpt && (
        <div className="p-4 border-t">
          <p className="text-muted-foreground text-sm line-clamp-2">
            {post.excerpt}
          </p>
        </div>
      )}
    </Link>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/components/blog-card.spec.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/blog/blog-card.tsx tests/components/blog-card.spec.tsx
git commit -m "feat: add BlogCard component"
```

---

### Task 5: RichTextEditor component (Tiptap)

**Files:**

- Create: `components/blog/rich-text-editor.tsx`

**Step 1: Write failing test**

```typescript
// tests/components/rich-text-editor.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RichTextEditor } from '@/components/blog/rich-text-editor'

describe('RichTextEditor', () => {
  it('renders editor toolbar', () => {
    render(<RichTextEditor content={{}} onChange={() => {}} />)
    expect(screen.getByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/components/rich-text-editor.spec.tsx`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// components/blog/rich-text-editor.tsx
'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Code, Image as ImageIcon, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'

interface RichTextEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string any>) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Write something amazing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Code"
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        <Button type="button" variant="ghost" size="icon-sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-lg">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/components/rich-text-editor.spec.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/blog/rich-text-editor.tsx tests/components/rich-text-editor.spec.tsx
git commit -m "feat: add Tiptap rich text editor"
```

---

## Phase 4: Pages

### Task 6: Blog listing page

**Files:**

- Create: `app/blog/page.tsx`

**Step 1: Write failing test (E2E)**

```typescript
// tests/e2e/blog-listing.spec.ts
import { test, expect } from '@playwright/test'

test('blog listing shows published posts', async ({ page }) => {
  await page.goto('/blog')
  await expect(page.locator('h1')).toContainText('Blog')
})
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/blog-listing.spec.ts`
Expected: FAIL (page doesn't exist)

**Step 3: Write implementation**

```typescript
// app/blog/page.tsx
import { createClient } from '@/lib/supabase/server'
import { BlogCard } from '@/components/blog/blog-card'
import { Header } from '@/components/ui/header'

export const revalidate = 60

export default async function BlogPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      excerpt,
      cover_image,
      published_at,
      read_time_minutes,
      author:users!posts_author_id_fkey(id, display_name, avatar_url)
    `)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tutorials, case studies, and thoughts from the VibeDev community
            </p>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={{
                    id: post.id,
                    title: post.title,
                    excerpt: post.excerpt,
                    cover_image: post.cover_image,
                    published_at: post.published_at,
                    read_time_minutes: post.read_time_minutes,
                    author: post.author,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                No blog posts yet. Be the first to write one!
              </p>
              <a
                href="/blog/editor"
                className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
              >
                Write a post
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/blog-listing.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/blog/page.tsx tests/e2e/blog-listing.spec.ts
git commit -m "feat: add blog listing page"
```

---

### Task 7: Blog post detail page

**Files:**

- Create: `app/blog/[id]/page.tsx`

**Step 1: Write failing test (E2E)**

```typescript
// tests/e2e/blog-post.spec.ts
import { test, expect } from '@playwright/test'

test('blog post page shows content', async ({ page }) => {
  await page.goto('/blog/some-post-id')
  await expect(page.locator('article')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/blog-post.spec.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// app/blog/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { Clock, Calendar, User, ArrowLeft, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommentSection } from '@/components/blog/comment-section'

interface Props {
  params: Promise<{ id: string }>
}

export const revalidate = 300

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, display_name, avatar_url, bio)
    `)
    .eq('id', id)
    .single()

  if (error || !post || post.status !== 'published') {
    notFound()
  }

  return (
    <article className="min-h-screen bg-background">
      <header className="relative h-[50vh] overflow-hidden">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-20 left-4 md:left-8 lg:left-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pb-12 md:pb-20">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <Link
                href={`/${post.author?.display_name?.toLowerCase().replace(/\s+/g, '')}`}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {post.author?.display_name?.charAt(0) ?? 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {post.author?.display_name ?? 'Anonymous'}
                </span>
              </Link>

              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </span>
              )}

              {post.read_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.read_time_minutes} min read
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 md:px-8 py-12">
        {post.excerpt && (
          <p className="text-xl text-muted-foreground mb-8 italic">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          {post.content && typeof post.content === 'object' ? (
            <div dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }} />
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        <hr className="my-12 border-border" />

        <CommentSection postId={post.id} />
      </div>
    </article>
  )
}

function contentToHtml(content: Record<string, any>): string {
  return contentToHtmlRecursive(content)
}

function contentToHtmlRecursive(node: any): string {
  if (typeof node === 'string') return node

  if (!node || !node.type) return ''

  switch (node.type) {
    case 'doc':
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''
    case 'paragraph':
      return `<p>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</p>`
    case 'heading':
      const level = node.attrs?.level ?? 2
      return `<h${level}>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</h${level}>`
    case 'bulletList':
      return `<ul>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ul>`
    case 'orderedList':
      return `<ol>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ol>`
    case 'listItem':
      return `<li>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</li>`
    case 'codeBlock':
      return `<pre><code>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</code></pre>`
    case 'image':
      return `<img src="${node.attrs?.src ?? ''}" alt="${node.attrs?.alt ?? ''}" />`
    case 'text':
      let html = node.text ?? ''
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              html = `<strong>${html}</strong>`
              break
            case 'italic':
              html = `<em>${html}</em>`
              break
            case 'code':
              html = `<code>${html}</code>`
              break
            case 'link':
              html = `<a href="${mark.attrs?.href ?? ''}">${html}</a>`
              break
          }
        })
      }
      return html
    default:
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/blog-post.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/blog/[id]/page.tsx tests/e2e/blog-post.spec.ts
git commit -m "feat: add blog post detail page"
```

---

### Task 8: Blog editor page

**Files:**

- Create: `app/blog/editor/page.tsx`

**Step 1: Write failing test (E2E)**

```typescript
// tests/e2e/blog-editor.spec.ts
import { test, expect } from '@playwright/test'

test('blog editor loads for authenticated user', async ({ page }) => {
  await page.goto('/blog/editor')
  await expect(page.locator('[data-editor]')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/blog-editor.spec.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// app/blog/editor/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/ui/header'
import { RichTextEditor } from '@/components/blog/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBlogPost } from '@/lib/actions/blog'
import { toast } from 'sonner'

export default function BlogEditorPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState<Record<string, any>>({})
  const [coverImage, setCoverImage] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please add a title')
      return
    }

    setSaving(true)

    try {
      const result = await createBlogPost({
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        cover_image: coverImage.trim() || undefined,
      })

      if (result.success) {
        toast.success('Post published!')
        router.push(`/blog/${result.slug}`)
      } else {
        toast.error(result.error ?? 'Failed to publish')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    toast.info('Draft saved (not implemented yet)')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-serif text-3xl font-bold">Write a Post</h1>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={saving}>
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          <div className="space-y-6" data-editor>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your post a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Input
                id="excerpt"
                placeholder="A brief summary of your post"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image URL (optional)</Label>
              <Input
                id="cover"
                placeholder="https://example.com/image.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/blog-editor.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/blog/editor/page.tsx tests/e2e/blog-editor.spec.ts
git commit -m "feat: add blog editor page"
```

---

### Task 9: Comment section component

**Files:**

- Create: `components/blog/comment-section.tsx`

**Step 1: Write failing test**

```typescript
// tests/components/comment-section.spec.tsx
import { render, screen } from '@testing-library/react'
import { CommentSection } from '@/components/blog/comment-section'

describe('CommentSection', () => {
  it('renders comments when provided', () => {
    render(<CommentSection postId="123" />)
    expect(screen.getByText('Comments')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/components/comment-section.spec.tsx`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// components/blog/comment-section.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Flag, Send } from 'lucide-react'
import { createComment, getComments, reportComment } from '@/lib/actions/comments'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, isLoggedIn } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setLoading(true)
    const data = await getComments(postId)
    setComments(data as Comment[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    const result = await createComment(postId, newComment)

    if (result.success) {
      setNewComment('')
      await loadComments()
      toast.success('Comment added')
    } else {
      toast.error(result.error ?? 'Failed to add comment')
    }

    setSubmitting(false)
  }

  const handleReport = async (commentId: string, reason: string) => {
    const result = await reportComment(commentId, reason)
    if (result.success) {
      toast.success('Comment reported for review')
    } else {
      toast.error('Failed to report comment')
    }
  }

  return (
    <section>
      <h2 className="font-serif text-2xl font-bold mb-6">Comments</h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3 min-h-[100px]"
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-muted-foreground">
            <a href="/user/auth" className="text-primary hover:underline">Sign in</a> to leave a comment
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={comment.user.avatar_url ?? undefined} />
                <AvatarFallback>
                  {comment.user.display_name?.charAt(0) ?? 'A'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{comment.user.display_name}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleReport(comment.id, 'spam')}
                    aria-label="Report comment"
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-foreground">{comment.content}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No comments yet. Be the first!</p>
      )}
    </section>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/components/comment-section.spec.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/blog/comment-section.tsx tests/components/comment-section.spec.tsx
git commit -m "feat: add comment section component"
```

---

## Phase 5: Navigation

### Task 10: Add blog link to navigation

**Files:**

- Modify: `components/ui/navbar.tsx`

**Step 1: Add blog link to navbar**

```tsx
// In navbar links array, add:
{
  label: 'Blog',
  href: '/blog',
},
```

**Step 2: Commit**

```bash
git add components/ui/navbar.tsx
git commit -m "feat: add blog link to navigation"
```

---

## Phase 6: Testing & Verification

### Task 11: Run full test suite

**Step 1: Run all tests**

```bash
npx vitest run
npx playwright test
```

**Step 2: Run typecheck**

```bash
pnpm exec tsc --noEmit
```

**Step 3: Run lint**

```bash
pnpm lint
```

**Step 4: Commit test results**

```bash
git add -A
git commit -m "test: run full test suite for blog feature"
```

---

### Task 12: Verify in browser

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Manual testing checklist**

- [ ] Navigate to /blog - page loads with header
- [ ] Click "Write a Post" - redirect to editor
- [ ] Fill title, content, click Publish - redirects to post
- [ ] Post displays correctly with author info
- [ ] Add comment - appears in list
- [ ] Report comment - success toast
- [ ] Dark mode - styles apply correctly

**Step 3: Commit verification**

```bash
git commit -m "test: manual browser verification complete"
```

---

## Plan Complete

**Worktree:** `.worktrees/blog-feature`

**Files Created:**

- `scripts/12_add_blog_columns.sql`
- `lib/actions/blog.ts`
- `lib/actions/comments.ts`
- `components/blog/blog-card.tsx`
- `components/blog/rich-text-editor.tsx`
- `components/blog/comment-section.tsx`
- `app/blog/page.tsx`
- `app/blog/[id]/page.tsx`
- `app/blog/editor/page.tsx`

**Files Modified:**

- `components/ui/navbar.tsx`
- `.gitignore`

**Total Tasks:** 12

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-12-20-blog-feature.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
