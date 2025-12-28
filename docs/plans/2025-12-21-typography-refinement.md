# Typography Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine typography across the entire project to be consistent, responsive (fluid), and SEO-friendly using a modern clean aesthetic.

**Architecture:** Use CSS variables with `clamp()` for fluid scaling in `globals.css`. Register these in Tailwind v4 theme. Create a unified `Typography` component set for semantic usage.

**Tech Stack:** Tailwind CSS v4, Next.js 16, React 19, CSS Variables.

---

### Task 1: Core Typography CSS Variables & Base Styles

**Files:**

- Modify: `app/globals.css`

**Step 1: Define Fluid Variables**

Add the following to `:root` in `app/globals.css`. These use `clamp()` to scale smoothly between 16px (mobile) and 18px (desktop) base, with appropriate scales for headings.

```css
/* Fluid Typography Scale */
/* Mobile Base: 16px, Desktop Base: 18px */
/* Scale Ratio: ~1.2 (Mobile) to ~1.25 (Desktop) */

--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem); /* 12px -> 14px */
--text-sm: clamp(0.875rem, 0.83rem + 0.22vw, 1rem); /* 14px -> 16px */
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); /* 16px -> 18px */
--text-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem); /* 18px -> 20px */
--text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem); /* 20px -> 24px (H6) */
--text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 2rem); /* 24px -> 32px (H5) */
--text-3xl: clamp(1.875rem, 1.65rem + 1.125vw, 2.5rem); /* 30px -> 40px (H4) */
--text-4xl: clamp(2.25rem, 1.95rem + 1.5vw, 3rem); /* 36px -> 48px (H3) */
--text-5xl: clamp(3rem, 2.5rem + 2.5vw, 4rem); /* 48px -> 64px (H2) */
--text-6xl: clamp(3.75rem, 3.25rem + 2.5vw, 5rem); /* 60px -> 80px (H1) */
```

**Step 2: Register in Tailwind Theme**

Update `@theme inline` in `app/globals.css` to expose these as utility classes.

```css
--text-fluid-xs: var(--text-xs);
--text-fluid-sm: var(--text-sm);
--text-fluid-base: var(--text-base);
--text-fluid-lg: var(--text-lg);
--text-fluid-xl: var(--text-xl);
--text-fluid-2xl: var(--text-2xl);
--text-fluid-3xl: var(--text-3xl);
--text-fluid-4xl: var(--text-4xl);
--text-fluid-5xl: var(--text-5xl);
--text-fluid-6xl: var(--text-6xl);
```

**Step 3: Apply Base Styles & Optimizations**

Update `@layer base` in `app/globals.css` to set defaults and optimization flags.

```css
@layer base {
  html {
    text-rendering: optimizeLegibility;
    font-size-adjust: from-font;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-size: var(--text-base);
    line-height: 1.6;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply text-foreground font-sans tracking-tight;
    line-height: 1.1;
  }

  h1 {
    @apply text-fluid-6xl mb-6 font-bold;
  }
  h2 {
    @apply text-fluid-5xl mb-5 font-semibold;
  }
  h3 {
    @apply text-fluid-4xl mb-4 font-semibold;
  }
  h4 {
    @apply text-fluid-3xl mb-4 font-semibold;
  }
  h5 {
    @apply text-fluid-2xl mb-3 font-medium;
  }
  h6 {
    @apply text-fluid-xl mb-3 font-medium;
  }

  p {
    @apply mb-4 max-w-[65ch]; /* 65ch max-width for readability */
  }
}
```

**Step 4: Verify Compilation**

Run: `bun run build` (or just verify CSS validity)
Expected: No build errors.

**Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: implement fluid typography system and optimizations"
```

---

### Task 2: Typography Components

**Files:**

- Create: `components/ui/typography.tsx`

**Step 1: Create Component File**

Create `components/ui/typography.tsx` with semantic components.

```tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

// Helper interface for standard props
interface TypographyProps extends React.HTMLAttributes<HTMLElement> {}

export function H1({ className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'text-fluid-6xl text-foreground scroll-m-20 font-bold tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

export function H2({ className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        'text-fluid-5xl text-foreground scroll-m-20 font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  )
}

export function H3({ className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        'text-fluid-4xl text-foreground scroll-m-20 font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

export function H4({ className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        'text-fluid-3xl text-foreground scroll-m-20 font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

export function P({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'text-fluid-base text-foreground max-w-[65ch] leading-relaxed [&:not(:first-child)]:mt-6',
        className,
      )}
      {...props}
    />
  )
}

export function Lead({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-fluid-lg text-muted-foreground', className)}
      {...props}
    />
  )
}

export function Large({ className, ...props }: TypographyProps) {
  return (
    <div
      className={cn('text-fluid-lg text-foreground font-semibold', className)}
      {...props}
    />
  )
}

export function Small({ className, ...props }: TypographyProps) {
  return (
    <small
      className={cn(
        'text-fluid-sm text-foreground leading-none font-medium',
        className,
      )}
      {...props}
    />
  )
}

export function Muted({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-fluid-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
```

**Step 2: Verify Compilation**

Run: `bun tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add components/ui/typography.tsx
git commit -m "feat: add semantic typography components"
```

---

### Task 3: Documentation Update

**Files:**

- Modify: `docs/design-system.md`

**Step 1: Update Typography Section**

Replace the existing Typography section in `docs/design-system.md` with the new Fluid System documentation.

Content to add/replace:

- Explanation of Fluid Typography (Clamp).
- Table of new variables (`--text-fluid-*`).
- Usage examples of `Typography` components.
- Note about `max-w-[65ch]` for paragraphs.

**Step 2: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: update design system with fluid typography specs"
```

---

### Task 4: Final Verification

**Step 1: Build Check**

Run: `bun run build`
Expected: Success.

**Step 2: Lint Check**

Run: `bun lint`
Expected: Success.
