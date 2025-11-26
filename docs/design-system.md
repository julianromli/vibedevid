# VibeDev ID - Design System

## Overview

VibeDev ID menggunakan design system berbasis **shadcn/ui** dengan style **New York**, dikombinasikan dengan **Tailwind CSS v4** dan **CSS Variables** untuk theming.

---

## Color Palette

### Semantic Colors (CSS Variables)

Warna menggunakan **OKLCH color space** untuk konsistensi yang lebih baik.

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.99 0 0)` | Background utama |
| `--foreground` | `oklch(0 0 0)` | Text utama |
| `--card` | `oklch(1 0 0)` | Background card |
| `--primary` | `oklch(0 0 0)` | Button primary, links |
| `--secondary` | `oklch(0.94 0 0)` | Secondary actions |
| `--muted` | `oklch(0.97 0 0)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.44 0 0)` | Teks sekunder |
| `--accent` | `oklch(0.94 0 0)` | Hover states |
| `--destructive` | `oklch(0.63 0.19 23.03)` | Error, delete actions |
| `--border` | `oklch(0.92 0 0)` | Borders |
| `--input` | `oklch(0.94 0 0)` | Input backgrounds |
| `--ring` | `oklch(0 0 0)` | Focus rings |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0 0 0)` | Background utama |
| `--foreground` | `oklch(1 0 0)` | Text utama |
| `--card` | `oklch(0.14 0 0)` | Background card |
| `--primary` | `oklch(0.852 0.199 91.936)` | **Yellow/Gold accent** |
| `--secondary` | `oklch(0.25 0 0)` | Secondary actions |
| `--muted` | `oklch(0.23 0 0)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.72 0 0)` | Teks sekunder |
| `--accent` | `oklch(0.32 0 0)` | Hover states |
| `--destructive` | `oklch(0.69 0.2 23.91)` | Error, delete actions |
| `--border` | `oklch(0.26 0 0)` | Borders |

### Usage di Tailwind

```tsx
// Warna semantic
className="bg-background text-foreground"
className="bg-primary text-primary-foreground"
className="bg-muted text-muted-foreground"
className="border-border"

// Kombinasi
className="bg-card text-card-foreground border"
```

---

## Typography

### Font Families

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | **Geist** | Text utama, UI |
| `--font-mono` | **Geist Mono** | Code, technical |
| `--font-serif` | **Instrument Serif** | Display, accent |

### Usage

```tsx
className="font-sans"   // Geist (default)
className="font-mono"   // Geist Mono
className="font-serif"  // Instrument Serif
```

### Letter Spacing

Custom letter spacing dengan `--tracking-normal: -0.01em` untuk teks yang lebih rapat dan modern.

```tsx
className="tracking-tighter"  // -0.06em
className="tracking-tight"    // -0.035em
className="tracking-normal"   // -0.01em (default)
className="tracking-wide"     // 0.015em
```

### Heading Scale

```tsx
// Hero/Display
className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight"

// Page Title
className="text-3xl md:text-4xl font-bold"

// Section Title
className="text-2xl md:text-3xl font-semibold"

// Card Title
className="font-semibold leading-none"

// Body Text
className="text-base"  // atau tidak perlu class (default)

// Small/Muted
className="text-sm text-muted-foreground"
```

---

## Spacing

### Base Unit

`--spacing: 0.25rem` (4px)

### Common Patterns

```tsx
// Section padding
className="py-20 lg:py-32"

// Container
className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"

// Card internal
className="p-6"  // atau gap-6 untuk flex/grid

// Component gaps
className="gap-2"  // 8px - small
className="gap-4"  // 16px - medium
className="gap-6"  // 24px - large
className="gap-8"  // 32px - section spacing
className="gap-12" // 48px - large section
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.5rem` (8px) | Base radius |
| `--radius-sm` | `4px` | Small elements |
| `--radius-md` | `6px` | Inputs, badges |
| `--radius-lg` | `8px` | Cards, buttons |
| `--radius-xl` | `12px` | Large containers |

```tsx
className="rounded-sm"   // 4px
className="rounded-md"   // 6px
className="rounded-lg"   // 8px
className="rounded-xl"   // 12px
```

---

## Shadows

```tsx
className="shadow-2xs"   // Minimal shadow
className="shadow-xs"    // Extra small
className="shadow-sm"    // Small (default card)
className="shadow"       // Base shadow
className="shadow-md"    // Medium
className="shadow-lg"    // Large
className="shadow-xl"    // Extra large
className="shadow-2xl"   // Maximum
```

---

## Components

### Button

**Variants:**
- `default` - Primary action (bg-primary)
- `destructive` - Delete/dangerous actions
- `outline` - Secondary actions with border
- `secondary` - Alternative secondary
- `ghost` - Minimal, icon buttons
- `link` - Text link style

**Sizes:**
- `default` - h-9, px-4
- `sm` - h-8, px-3
- `lg` - h-10, px-6
- `icon` - size-9 (square)
- `icon-sm` - size-8
- `icon-lg` - size-10

```tsx
import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
<Button size="lg">Large Button</Button>
```

### Badge

**Variants:**
- `default` - Primary badge
- `secondary` - Neutral badge
- `destructive` - Error/warning
- `outline` - Border only

```tsx
import { Badge } from '@/components/ui/badge'

<Badge>New</Badge>
<Badge variant="secondary">Status</Badge>
<Badge variant="outline">Tag</Badge>
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">...</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## Layout Patterns

### Section Container

```tsx
<section className="py-20 lg:py-32">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

### Grid Patterns

```tsx
// 3 column responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 4 column responsive
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"

// Auto-fit
className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
```

### Flex Patterns

```tsx
// Center content
className="flex items-center justify-center"

// Space between
className="flex items-center justify-between"

// Stack (column)
className="flex flex-col gap-4"

// Row with wrap
className="flex flex-wrap gap-4"
```

---

## Animations

### Custom Keyframes (globals.css)

| Animation | Duration | Usage |
|-----------|----------|-------|
| `animate-slide` | 20s | Logo marquee horizontal scroll |
| `animate-scroll-up` | 10s | Testimonials vertical scroll |
| `animate-gradient` | 8s | Animated gradient text |
| `animate-heart-beat` | 0.6s | Like button feedback |
| `animate-glow` | 3s | Glassmorphism glow effect |
| `animate-spotlight` | 2s | Hero spotlight effect |
| `animate-aurora` | 60s | Aurora background |

### Transition Defaults

```tsx
// Quick transitions
className="transition-all duration-200"

// Smooth transitions
className="transition-all duration-300"

// Enter animations
className="transition-all duration-700 ease-out"
```

### Reduced Motion

Semua animasi dihentikan ketika user prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-slide,
  .animate-scroll-up {
    animation: none;
  }
}
```

---

## Dark Mode

### Implementation

Menggunakan `next-themes` dengan class-based dark mode.

```tsx
// Toggle theme
import { useTheme } from 'next-themes'
const { theme, setTheme } = useTheme()

// Component styling
className="bg-background dark:bg-background"
className="text-foreground"
```

### Custom Dark Variant

```css
@custom-variant dark (&:is(.dark *));
```

---

## Icons

**Library:** Lucide React

```tsx
import { ArrowRight, Menu, X, Heart, Star } from 'lucide-react'

// Default size in buttons
<ArrowRight className="h-4 w-4" />

// atau dengan size utility
<ArrowRight className="size-4" />
```

---

## UI Libraries & Registries

Project menggunakan multiple component registries:

| Registry | Usage |
|----------|-------|
| `@shadcn` | Base UI components |
| `@aceternity` | Advanced animations (spotlight, aurora) |
| `@magicui` | Enhanced UI components |
| `@originui` | Alternative components |

### Adding Components

```bash
# shadcn
pnpm dlx shadcn@latest add [component-name]

# From other registries
pnpm dlx shadcn@latest add [registry]/[component-name]
```

---

## Utility Classes

### cn() Helper

Gunakan `cn()` untuk merge className dengan conditional:

```tsx
import { cn } from '@/lib/utils'

className={cn(
  "base-classes",
  condition && "conditional-class",
  className
)}
```

### class-variance-authority (CVA)

Untuk component variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

const variants = cva("base-classes", {
  variants: {
    variant: {
      default: "variant-default",
      secondary: "variant-secondary",
    },
    size: {
      default: "size-default",
      sm: "size-small",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})
```

---

## Background Patterns

### Grid Pattern

```tsx
// Dot grid background
className="bg-grid-pattern"
```

CSS:
```css
.bg-grid-pattern {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(0, 0, 0, 0.4) 1px,
    transparent 0
  );
  background-size: 20px 20px;
}

.dark .bg-grid-pattern {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.3) 1px,
    transparent 0
  );
}
```

### Gradient Overlays

```tsx
className="from-background/80 via-background/60 to-background/80 bg-gradient-to-b"
```

---

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

```tsx
className="text-base md:text-lg lg:text-xl"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="px-4 sm:px-6 lg:px-8"
```

---

## Best Practices

1. **Gunakan semantic color tokens** - Jangan hardcode warna
2. **Prefer `gap` over margin** - Untuk flex/grid spacing
3. **Gunakan `size-x` untuk square** - Bukan `w-x h-x`
4. **Mobile-first responsive** - Start dengan mobile, tambah breakpoints
5. **Prefer CSS variables** - Untuk consistency theming
6. **Gunakan `cn()` helper** - Untuk conditional classes
7. **Ikuti component patterns** - Dari shadcn/ui structure
