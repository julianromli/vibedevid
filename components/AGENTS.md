# Components - AI Agent Guidelines

## Package Identity

React UI components for VibeDev ID application. Organized into base UI components (`ui/`), page sections (`sections/`), blog components (`blog/`), and project components (`project/`).

**Primary tech**: React 19, TypeScript, Tailwind CSS v4, Radix UI, shadcn/ui

## Setup & Run

```bash
# No separate setup needed - components are part of main app
# To see components in action, run dev server from root:
cd ../
bun dev
```

## Patterns & Conventions

### File Organization

```
components/
├── ui/                    # Base UI components (shadcn/ui + Radix)
│   ├── button.tsx             # Primitive components
│   ├── dialog.tsx             # Compound components
│   ├── navbar.tsx             # Complex app-specific components
│   ├── card.tsx               # Card containers
│   ├── input.tsx              # Form inputs
│   ├── avatar.tsx             # Avatar display
│   ├── comment-section.tsx    # ⭐ Unified comments (Blog + Project)
│   ├── ...                    # 50+ more UI components
├── sections/            # Page section components (self-contained)
│   ├── hero-section.tsx
│   ├── project-showcase.tsx
│   ├── faq-section.tsx
│   ├── cta-section.tsx
│   ├── ai-tools-section.tsx
│   ├── ai-leaderboard-section.tsx
│   ├── reviews-section.tsx
│   └── community-features-section.tsx
├── blog/               # Blog-specific components
│   ├── blog-card.tsx
│   ├── cover-image-uploader.tsx
│   ├── editor-image-uploader.tsx
│   └── rich-text-editor.tsx
├── project/            # Project-specific components
│   ├── ProjectActionsClient.tsx
│   ├── ProjectEditClient.tsx
│   └── ShareButton.tsx
└── *.tsx               # Root-level components (legacy)
    ├── client-theme-provider.tsx
    ├── theme-provider.tsx
    └── ...
```

### Naming Rules

- **File names**: `kebab-case.tsx` (e.g., `hero-section.tsx`, `filter-controls.tsx`)
- **Exported component**: `PascalCase` (e.g., `export function HeroSection()`)
- **Internal helpers**: `camelCase` (e.g., `function formatDate()`)
- **Component folders**: `kebab-case` (e.g., `blog/`, `project/`)

### Component Patterns

#### ✅ DO: Functional Components

```tsx
// components/ui/button.tsx
import { forwardRef } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva('base-classes', { variants: {...} })

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
)
Button.displayName = 'Button'
```

**Example**: See [`components/ui/button.tsx`](ui/button.tsx)

#### ✅ DO: Self-Contained Section Components

Section components should be **modular and composable**:

```tsx
// components/sections/hero-section.tsx
'use client'

import { Button } from '@/components/ui/button'
import { SafariMockup } from '@/components/ui/safari-mockup'
import type { User } from '@/types/homepage'

interface HeroSectionProps {
  isLoggedIn: boolean
  user?: User
  handleJoinWithUs: () => void
}

export function HeroSection({
  isLoggedIn,
  user,
  handleJoinWithUs,
}: HeroSectionProps) {
  return (
    <section className="container mx-auto">{/* Section content */}</section>
  )
}
```

**Example**: See [`components/sections/hero-section.tsx`](sections/hero-section.tsx)

#### ✅ DO: Blog Components

```tsx
// components/blog/blog-card.tsx
interface BlogCardProps {
  post: BlogPost
  onClick?: () => void
}

export function BlogCard({ post, onClick }: BlogCardProps) {
  return (
    <article className="blog-card" onClick={onClick}>
      {post.cover_image && <img src={post.cover_image} alt={post.title} />}
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <div className="meta">
        <span>{post.author_name}</span>
        <span>{formatDate(post.created_at)}</span>
      </div>
    </article>
  )
}
```

**Example**: See [`components/blog/blog-card.tsx`](blog/blog-card.tsx)

#### ✅ DO: Project Components

```tsx
// components/project/ProjectActionsClient.tsx
'use client'

import { HeartButton } from '@/components/ui/heart-button'
import { ShareButton } from './ShareButton'
import { useAuth } from '@/hooks/useAuth'

interface ProjectActionsClientProps {
  projectId: string
  initialLikes: number
  initialIsLiked: boolean
}

export function ProjectActionsClient({
  projectId,
  initialLikes,
  initialIsLiked,
}: ProjectActionsClientProps) {
  const { isLoggedIn, user } = useAuth()

  return (
    <div className="project-actions">
      <HeartButton
        projectId={projectId}
        initialCount={initialLikes}
        initialLiked={initialIsLiked}
        disabled={!isLoggedIn}
      />
      <ShareButton projectId={projectId} />
    </div>
  )
}
```

**Example**: See [`components/project/ProjectActionsClient.tsx`](project/ProjectActionsClient.tsx)

#### ✅ DO: Shared UI Components

Extract reusable UI patterns:

```tsx
// components/ui/safari-mockup.tsx
interface SafariMockupProps {
  src: string
  alt: string
}

export function SafariMockup({ src, alt }: SafariMockupProps) {
  return (
    <div className="browser-chrome">
      {/* Browser UI */}
      <img src={src} alt={alt} />
    </div>
  )
}
```

**Example**: See [`components/ui/safari-mockup.tsx`](ui/safari-mockup.tsx)

#### ✅ DO: Auth-Aware Components

Components that need auth should receive it as props:

```tsx
// Pass auth state from page level, not inside component
<Navbar isLoggedIn={isLoggedIn} user={user} />
```

**Pattern**: See auth detection in `app/page.tsx` and [`components/ui/navbar.tsx`](ui/navbar.tsx)

#### ✅ DO: Rich Text Editor for Blog

```tsx
// components/blog/rich-text-editor.tsx
'use client'

import { useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  // Implement rich text editing with toolbar
  return (
    <div className="rich-text-editor">
      <div className="toolbar">{/* Bold, Italic, Link, etc. */}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
```

**Example**: See [`components/blog/rich-text-editor.tsx`](blog/rich-text-editor.tsx)

#### ❌ DON'T: Client-Side Data Fetching in Components

```tsx
// ❌ BAD: Fetching data inside component
export function BadComponent() {
  const [data, setData] = useState()
  useEffect(() => {
    fetchData().then(setData) // Anti-pattern
  }, [])
}

// ✅ GOOD: Pass data as props
export function GoodComponent({ data }: { data: Data }) {
  return <div>{data.name}</div>
}
```

#### ❌ DON'T: Inline Styles or Hardcoded Colors

```tsx
// ❌ BAD
<div style={{ color: '#3b82f6' }}>Text</div>

// ✅ GOOD: Use Tailwind classes
<div className="text-blue-500">Text</div>
```

### Component Categories

#### Base UI (`components/ui/`)

Primitive and compound components from shadcn/ui + custom additions:

- **Primitives**: `button`, `input`, `label`, `checkbox`, `switch`, `textarea`, `select`
- **Display**: `avatar`, `badge`, `card`, `skeleton`, `progress`
- **Feedback**: `alert`, `toast/sonner`, `alert-dialog`, `dialog`, `modal`, `drawer`
- **Navigation**: `navbar`, `dropdown-menu`, `tabs`, `breadcrumb`
- **Layout**: `aspect-ratio`, `separator`, `empty`
- **Forms**: `form`, `input`, `select`, `checkbox`, `toggle`
- **Specialty**: `spotlight`, `animated-tooltip`, `progressive-image`, `theme-toggle`
- **Integration**: `youtube-video-showcase`, `safari-mockup`, `video-vibe-coding-manager`
- **Demo**: `avatar-uploader`, `upload-dropzone`, `profile-edit-dialog`

#### Section Components (`components/sections/`)

Self-contained page sections extracted from monolithic pages:

- `hero-section.tsx` - Hero with CTA
- `project-showcase.tsx` - Filterable project grid
- `ai-tools-section.tsx` - AI tools showcase
- `ai-leaderboard-section.tsx` - AI tools ranking
- `reviews-section.tsx` - Testimonials
- `faq-section.tsx` - FAQ accordion
- `cta-section.tsx` - Call-to-action
- `community-features-section.tsx` - Community features

#### Blog Components (`components/blog/`)

Blog-specific functionality:

- `blog-card.tsx` - Blog post preview card
- `cover-image-uploader.tsx` - Cover image upload
- `editor-image-uploader.tsx` - Inline image upload for editor
- `rich-text-editor.tsx` - Markdown/rich text editor

> **Note**: Comments moved to unified `components/ui/comment-section.tsx`

#### Project Components (`components/project/`)

Project-specific functionality:

- `ProjectActionsClient.tsx` - Like, share actions
- `ProjectEditClient.tsx` - Project editing form
- `ShareButton.tsx` - Share functionality

> **Note**: Comments moved to unified `components/ui/comment-section.tsx`

### ⭐ Unified Comments Pattern (IMPORTANT)

The comments feature is **centralized** for both Blog and Project pages using a single component.

#### Location

- **Component**: `components/ui/comment-section.tsx`
- **Types**: `types/comments.ts`
- **Server Actions**: `lib/actions/comments.ts`

#### Usage Pattern

```tsx
// In Blog page (app/blog/[slug]/page.tsx)
import { CommentSection } from '@/components/ui/comment-section'
import { getComments } from '@/lib/actions/comments'

// Fetch comments server-side
const { comments: initialComments } = await getComments('post', post.id)

// Render component
<CommentSection
  entityType="post"           // 'post' for blog, 'project' for projects
  entityId={post.id}          // UUID of the entity
  initialComments={initialComments}
  isLoggedIn={!!user}
  currentUser={{ id, name, avatar }}
  allowGuest={false}          // Blog requires login
/>

// In Project page (app/project/[slug]/page.tsx)
<CommentSection
  entityType="project"
  entityId={project.id}
  initialComments={initialComments}
  isLoggedIn={!!currentUser}
  currentUser={currentUser ? { id, name, avatar } : null}
  allowGuest={true}           // Projects allow guest comments
/>
```

#### Features

| Feature | Description |
|---------|-------------|
| Server-side prefetch | `initialComments` prop for fast initial render |
| Guest commenting | Configurable via `allowGuest` prop |
| Report feature | Logged-in users can report inappropriate comments |
| Loading spinner | Shows during comment submission |
| Comment count | Displayed in header |
| Toast notifications | Success/error feedback via sonner |
| Card-based UI | Modern card layout for each comment |
| Newest first | Comments sorted by newest first |
| Relative timestamps | "2h ago", "Yesterday", etc. |
| Guest badge | Visual indicator for guest comments |
| Role badge | Shows user roles via UserDisplayName |

#### Props Interface

```tsx
interface CommentSectionProps {
  entityType: 'post' | 'project'  // Type of parent entity
  entityId: string                 // UUID of parent entity
  initialComments: Comment[]       // Pre-fetched comments
  isLoggedIn: boolean              // User authentication state
  currentUser?: {                  // Current user info (optional)
    id: string
    name: string
    avatar?: string
  } | null
  allowGuest?: boolean             // Allow guest comments (default: false)
}
```

#### ❌ DON'T: Create Separate Comment Components

```tsx
// ❌ BAD: Creating feature-specific comment components
// components/blog/comment-section.tsx
// components/project/CommentsSection.tsx

// ✅ GOOD: Use unified component
import { CommentSection } from '@/components/ui/comment-section'
```

### Theme & Hydration Safety

Components using `next-themes` must handle hydration:

```tsx
// ✅ GOOD: Wrap ThemeProvider in client-only component
// See components/client-theme-provider.tsx
'use client'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'

export function ClientThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

**Example**: [`components/client-theme-provider.tsx`](client-theme-provider.tsx)

## Touch Points / Key Files

**Core UI Components**:

- Button variants: [`ui/button.tsx`](ui/button.tsx)
- Navbar with auth: [`ui/navbar.tsx`](ui/navbar.tsx)
- Dialogs & modals: [`ui/dialog.tsx`](ui/dialog.tsx), [`ui/modal.tsx`](ui/modal.tsx)
- Form inputs: [`ui/input.tsx`](ui/input.tsx), [`ui/textarea.tsx`](ui/textarea.tsx)
- Theme toggle: [`ui/theme-toggle.tsx`](ui/theme-toggle.tsx)
- Avatar system: [`ui/avatar.tsx`](ui/avatar.tsx), [`ui/optimized-avatar.tsx`](ui/optimized-avatar.tsx)

**Section Components**:

- Hero section: [`sections/hero-section.tsx`](sections/hero-section.tsx)
- Project showcase: [`sections/project-showcase.tsx`](sections/project-showcase.tsx)
- FAQ section: [`sections/faq-section.tsx`](sections/faq-section.tsx)
- AI tools: [`sections/ai-tools-section.tsx`](sections/ai-tools-section.tsx)
- AI leaderboard: [`sections/ai-leaderboard-section.tsx`](sections/ai-leaderboard-section.tsx)

**Blog Components**:

- Blog card: [`blog/blog-card.tsx`](blog/blog-card.tsx)
- Rich text editor: [`blog/rich-text-editor.tsx`](blog/rich-text-editor.tsx)

**Project Components**:

- Actions: [`project/ProjectActionsClient.tsx`](project/ProjectActionsClient.tsx)
- Share: [`project/ShareButton.tsx`](project/ShareButton.tsx)

**Unified Components** (shared across features):

- Comments: [`ui/comment-section.tsx`](ui/comment-section.tsx) ⭐

**Utility Components**:

- Progressive images: [`ui/progressive-image.tsx`](ui/progressive-image.tsx)
- Avatar uploader: [`ui/avatar-uploader.tsx`](ui/avatar-uploader.tsx)
- Error boundary: [`ui/error-boundary.tsx`](ui/error-boundary.tsx)

## JIT Index Hints

```bash
# Find a specific component
bunx find components -name "*component-name*"

# Find all section components
bunx find components/sections -name "*.tsx"

# Find all UI components
bunx find components/ui -name "*.tsx"

# Find all blog components
bunx find components/blog -name "*.tsx"

# Find all project components
bunx find components/project -name "*.tsx"

# Search for component usage
findstr /s /i "ComponentName" app\*.tsx

# Find components using a specific hook
findstr /s /i "useAuth" components\*.tsx

# Find client components
findstr /s /i "'use client'" components\*.tsx components\**\*.tsx
```

## Common Gotchas

- **Theme hydration**: Always use `ClientThemeProvider` wrapper, add `suppressHydrationWarning` to `<body>` in layout
- **Auth state**: Pass auth props from page level, don't fetch inside components
- **Image optimization**: Use Next.js `<Image>` component with proper `remotePatterns` in `next.config.mjs`
- **Client components**: Add `'use client'` directive for interactive components (hooks, state, events)
- **Absolute imports**: Always use `@/` prefix (e.g., `@/components/ui/button`)
- **Rich text**: Blog editor requires proper image upload handling
- **Comments**: Use unified `CommentSection` from `@/components/ui/comment-section` for both Blog and Project
- **Forms**: Use proper validation before submission
- **Responsive**: Test components across different screen sizes

## Pre-Component Checks

Before creating/modifying components:

```bash
# Type check
cd ../
bun tsc --noEmit

# Lint
bun lint

# Format
bun format
```

## Component Checklist

Before creating a new component:

- [ ] Choose correct location (ui/, sections/, blog/, project/)
- [ ] Add `'use client'` if component uses hooks, state, or events
- [ ] Use proper TypeScript interfaces for props
- [ ] Follow naming conventions (kebab-case file, PascalCase export)
- [ ] Use Tailwind classes instead of inline styles
- [ ] Extract reusable logic to hooks if needed
- [ ] Test responsive behavior
- [ ] Test theme compatibility if applicable

## Future Component Ideas

- **Data display**: Data tables, charts, graphs
- **Forms**: Form builder, field arrays, validation schemas
- **Navigation**: Breadcrumbs, pagination, stepper
- **Blog**: Table of contents, author bio, related posts
- **Project**: Project gallery, before/after slider, video embed
