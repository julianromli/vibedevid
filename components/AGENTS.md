# Components - AI Agent Guidelines

## Package Identity
React UI components for VibeDev ID application. Organized into base UI components (`ui/`) and page sections (`sections/`).

**Primary tech**: React 19, TypeScript, Tailwind CSS v4, Radix UI, shadcn/ui

## Setup & Run
```bash
# No separate setup needed - components are part of main app
# To see components in action, run dev server from root:
cd ../
pnpm dev
```

## Patterns & Conventions

### File Organization
```
components/
├── ui/              # Base UI components (shadcn/ui + Radix)
│   ├── button.tsx       # Primitive components
│   ├── dialog.tsx       # Compound components
│   ├── navbar.tsx       # Complex app-specific components
│   └── ...
├── sections/        # Page section components (self-contained)
│   ├── hero-section.tsx
│   ├── project-showcase.tsx
│   └── ...
└── *.tsx            # Legacy components (to be moved)
```

### Naming Rules
- **File names**: `kebab-case.tsx` (e.g., `hero-section.tsx`, `filter-controls.tsx`)
- **Exported component**: `PascalCase` (e.g., `export function HeroSection()`)
- **Internal helpers**: `camelCase` (e.g., `function formatDate()`)

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

export function HeroSection({ isLoggedIn, user, handleJoinWithUs }: HeroSectionProps) {
  return (
    <section className="container mx-auto">
      {/* Section content */}
    </section>
  )
}
```
**Example**: See [`components/sections/hero-section.tsx`](sections/hero-section.tsx)

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

#### ❌ DON'T: Client-Side Data Fetching in Components
```tsx
// ❌ BAD: Fetching data inside component
export function BadComponent() {
  const [data, setData] = useState()
  useEffect(() => {
    fetchData().then(setData)  // Anti-pattern
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
- **Primitives**: `button`, `input`, `label`, `checkbox`, `switch`
- **Compound**: `dialog`, `dropdown-menu`, `select`, `alert-dialog`
- **Complex**: `navbar`, `footer`, `avatar-uploader`, `submit-project-form`

#### Section Components (`components/sections/`)
Self-contained page sections extracted from monolithic pages:
- `hero-section.tsx` - Hero with CTA
- `project-showcase.tsx` - Filterable project grid
- `ai-tools-section.tsx` - AI tools showcase
- `reviews-section.tsx` - Testimonials
- `faq-section.tsx` - FAQ accordion
- `cta-section.tsx` - Call-to-action

### Theme & Hydration Safety
Components using `next-themes` must handle hydration:
```tsx
// ✅ GOOD: Wrap ThemeProvider in client-only component
// See components/client-theme-provider.tsx
'use client'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return <>{children}</>
  
  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
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

**Section Components**:
- Hero section: [`sections/hero-section.tsx`](sections/hero-section.tsx)
- Project showcase: [`sections/project-showcase.tsx`](sections/project-showcase.tsx)
- FAQ section: [`sections/faq-section.tsx`](sections/faq-section.tsx)

**Utility Components**:
- Progressive images: [`ui/progressive-image.tsx`](ui/progressive-image.tsx)
- Avatar system: [`ui/avatar-uploader.tsx`](ui/avatar-uploader.tsx), [`ui/optimized-avatar.tsx`](ui/optimized-avatar.tsx)

## JIT Index Hints

```bash
# Find a specific component
pnpm exec find components -name "*component-name*"

# Find all section components
pnpm exec find components/sections -name "*.tsx"

# Find all UI components
pnpm exec find components/ui -name "*.tsx"

# Search for component usage
findstr /s /i "ComponentName" app\*.tsx

# Find components using a specific hook
findstr /s /i "useAuth" components\*.tsx
```

## Common Gotchas

- **Theme hydration**: Always use `ClientThemeProvider` wrapper, add `suppressHydrationWarning` to `<body>` in layout
- **Auth state**: Pass auth props from page level, don't fetch inside components
- **Image optimization**: Use Next.js `<Image>` component with proper `remotePatterns` in `next.config.mjs`
- **Client components**: Add `'use client'` directive for interactive components (hooks, state, events)
- **Absolute imports**: Always use `@/` prefix (e.g., `@/components/ui/button`)

## Pre-Component Checks

Before creating/modifying components:
```bash
# Type check
cd ../
pnpm exec tsc --noEmit

# Lint
pnpm lint

# Format
pnpm format
```
