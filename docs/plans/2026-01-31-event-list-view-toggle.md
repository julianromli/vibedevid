# Event List View Toggle Design

## Overview

Add grid/list view toggle to the AI Events list page. Users can switch between card grid (current) and horizontal list view.

## Component Architecture

Extend existing `EventCard` with `variant` prop:

```
EventCard
├── variant="grid" (default, current layout)
└── variant="list" (horizontal: thumbnail left, details right)

EventFilterControls
└── + viewMode toggle (Grid/List icons)

Page State
└── viewMode: 'grid' | 'list' (localStorage persisted)
```

Toggle UI: Two icon buttons (LayoutGrid + List from lucide-react), grouped with border, active state highlighted.

Filter bar layout: `[Kategori] [Lokasi] [Urutkan] ... [Grid|List toggle]`

## State Management

Use localStorage for persistence:

```typescript
// In page component or custom hook
const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('eventViewMode') as 'grid' | 'list' || 'grid'
  }
  return 'grid'
})

useEffect(() => {
  localStorage.setItem('eventViewMode', viewMode)
}, [viewMode])
```

Grid container changes:
- Grid view: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- List view: `flex flex-col gap-4` (single column)

## List View Card Layout

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────┐  Title Event Name Here                     │
│ │          │  📅 15 Feb 2025 • 09:00                    │
│ │  Image   │  📍 Jakarta Convention Center              │
│ │ 120x80   │  Organizer: AI Indonesia Community         │
│ └──────────┘                                            │
│  [Category] [Status]                                    │
└─────────────────────────────────────────────────────────┘
```

Key differences from grid:
- No description (too long for horizontal)
- Badges below image instead of overlay
- Compact vertical spacing
- Full width card

## Implementation

```tsx
// EventCard with variant prop
interface EventCardProps {
  event: AIEvent
  variant?: 'grid' | 'list'
}

// variant="list" structure
<Card className="flex gap-4 p-4">
  <div className="relative w-[120px] h-[80px] shrink-0 rounded-md overflow-hidden">
    <Image ... />
  </div>
  <div className="flex-1 min-w-0">
    <h3>Title</h3>
    <div>Date</div>
    <div>Location</div>
    <div>Organizer</div>
    <div className="flex gap-2 mt-2">
      <Badge>Category</Badge>
      <Badge>Status</Badge>
    </div>
  </div>
</Card>
```

## Files to Modify

1. `components/event/event-card.tsx` - Add variant prop and list layout
2. `components/event/event-filter-controls.tsx` - Add view toggle buttons
3. `app/event/list/page.tsx` - Add viewMode state and pass to components
