# Design Document: AI Events List Page

## Overview

Halaman AI Events List (`/event/list`) adalah fitur baru di platform VibeDevID yang menampilkan daftar event-event AI di Indonesia. Desain mengikuti pola yang sudah ada di `/project/list` dengan penyesuaian untuk kebutuhan event. Fase pertama menggunakan data mock tanpa integrasi database.

## Architecture

### Struktur File

```
app/
└── event/
    └── list/
        └── page.tsx          # Halaman utama event list

lib/
└── data/
    └── mock-events.ts        # Data mock untuk event

types/
└── events.ts                 # Type definitions untuk event
```

### Component Hierarchy

```
EventListPage (page.tsx)
├── Navbar
├── EventListHeader
│   └── Title & Description
├── EventFilterControls
│   ├── CategoryFilter (dropdown)
│   ├── LocationFilter (dropdown)
│   └── SortControl (dropdown)
├── EventGrid
│   └── EventCard[] (multiple)
│       ├── CoverImage
│       ├── CategoryBadge
│       ├── StatusBadge
│       ├── EventInfo (title, date, location, organizer)
│       └── Description
└── Footer
```

## Components and Interfaces

### EventCard Component

Komponen untuk menampilkan informasi singkat satu event.

```typescript
interface EventCardProps {
  event: AIEvent
}

function EventCard({ event }: EventCardProps) {
  // Render card dengan:
  // - Cover image dengan AspectRatio 16:9
  // - Category badge (top-left)
  // - Status badge (top-right) dengan warna berbeda per status
  // - Event title
  // - Date & time
  // - Location type icon + location text
  // - Organizer name
  // - Short description (line-clamp-2)
}
```

### EventFilterControls Component

Komponen untuk filter dan sort event.

```typescript
interface EventFilterControlsProps {
  selectedCategory: EventCategory | 'All'
  setSelectedCategory: (category: EventCategory | 'All') => void
  selectedLocation: EventLocationType | 'All'
  setSelectedLocation: (location: EventLocationType | 'All') => void
  selectedSort: 'nearest' | 'latest'
  setSelectedSort: (sort: 'nearest' | 'latest') => void
}
```

### Status Badge Colors

```typescript
const statusColors = {
  upcoming: 'bg-green-500/20 text-green-500 border-green-500/30',
  ongoing: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  past: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
}
```

## Data Models

### AIEvent Type

```typescript
interface AIEvent {
  id: string
  slug: string
  name: string                    // Nama event
  date: string                    // ISO date string
  time: string                    // Format: "HH:mm"
  endDate?: string                // Optional untuk multi-day events
  endTime?: string
  locationType: EventLocationType // 'online' | 'offline' | 'hybrid'
  locationDetail: string          // Alamat atau link meeting
  description: string             // Deskripsi singkat
  organizer: string               // Nama organizer/komunitas
  registrationUrl: string         // Link registrasi
  coverImage: string              // URL cover image
  category: EventCategory         // 'workshop' | 'meetup' | 'conference' | 'hackathon'
  status: EventStatus             // 'upcoming' | 'ongoing' | 'past'
}

type EventCategory = 'workshop' | 'meetup' | 'conference' | 'hackathon'
type EventLocationType = 'online' | 'offline' | 'hybrid'
type EventStatus = 'upcoming' | 'ongoing' | 'past'
```

### Mock Data Structure

```typescript
// lib/data/mock-events.ts
export const mockEvents: AIEvent[] = [
  {
    id: '1',
    slug: 'ai-workshop-jakarta-2025',
    name: 'AI Workshop Jakarta 2025',
    date: '2025-02-15',
    time: '09:00',
    locationType: 'offline',
    locationDetail: 'Jakarta Convention Center',
    description: 'Workshop hands-on tentang implementasi AI...',
    organizer: 'AI Indonesia Community',
    registrationUrl: 'https://example.com/register',
    coverImage: '/placeholder.jpg',
    category: 'workshop',
    status: 'upcoming'
  },
  // ... 5+ more events
]
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Event Card Rendering Completeness

*For any* event dalam data mock, ketika di-render sebagai EventCard, output SHALL menampilkan nama event, tanggal, waktu, lokasi, deskripsi, organizer, cover image, badge kategori, dan badge status.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Category Filter Correctness

*For any* kategori filter yang dipilih (selain 'All'), semua event yang ditampilkan SHALL memiliki kategori yang sama dengan filter yang dipilih.

**Validates: Requirements 2.4**

### Property 3: Location Filter Correctness

*For any* tipe lokasi filter yang dipilih (selain 'All'), semua event yang ditampilkan SHALL memiliki tipe lokasi yang sama dengan filter yang dipilih.

**Validates: Requirements 2.5**

### Property 4: Date Filter Correctness

*For any* rentang tanggal filter yang dipilih, semua event yang ditampilkan SHALL memiliki tanggal dalam rentang tersebut (inclusive).

**Validates: Requirements 2.6**

### Property 5: Combined Filter AND Logic

*For any* kombinasi filter yang aktif (kategori, lokasi, tanggal), semua event yang ditampilkan SHALL memenuhi SEMUA kriteria filter yang aktif secara bersamaan.

**Validates: Requirements 2.7**

### Property 6: Sort by Nearest Date

*For any* dua event berurutan dalam list hasil, event pertama SHALL memiliki tanggal yang lebih dekat atau sama dengan event kedua dari tanggal hari ini.

**Validates: Requirements 3.1, 3.2**

### Property 7: Status Priority in Sort

*For any* dua event dalam list hasil, jika event pertama memiliki status 'past' dan event kedua memiliki status 'upcoming', maka urutan tersebut TIDAK VALID (upcoming harus di atas past).

**Validates: Requirements 3.3**

### Property 8: Mock Data Field Completeness

*For any* event dalam mock data, event tersebut SHALL memiliki semua required fields (id, slug, name, date, time, locationType, locationDetail, description, organizer, registrationUrl, coverImage, category, status) dengan nilai yang tidak null atau undefined.

**Validates: Requirements 5.4**

## Error Handling

### Empty State

Ketika tidak ada event yang sesuai dengan filter:
- Tampilkan pesan "Tidak ada event yang sesuai dengan filter"
- Tampilkan tombol untuk reset filter

### Image Loading Error

Ketika cover image gagal dimuat:
- Gunakan placeholder image default (`/placeholder.jpg`)
- Implementasi dengan `onError` handler di Image component

### Invalid Date Handling

Ketika tanggal event tidak valid:
- Skip event tersebut dari rendering
- Log warning ke console untuk debugging

## Testing Strategy

### Unit Tests

Unit tests fokus pada:
1. **Filter Logic**: Test fungsi filter untuk setiap tipe filter
2. **Sort Logic**: Test fungsi sort untuk urutan tanggal
3. **Status Calculation**: Test fungsi yang menentukan status event (upcoming/ongoing/past)
4. **Mock Data Validation**: Test bahwa mock data memiliki struktur yang benar

### Property-Based Tests

Property-based tests menggunakan library `fast-check` dengan minimum 100 iterasi per test:

1. **Filter Properties**: Generate random filter combinations dan verifikasi hasil
2. **Sort Properties**: Generate random event lists dan verifikasi urutan
3. **Data Completeness**: Generate random events dan verifikasi semua fields ada

Setiap property test harus di-tag dengan format:
```
// Feature: ai-events-list, Property N: [property description]
```

### Integration Tests (Playwright)

Integration tests untuk:
1. Page loads correctly dengan semua komponen
2. Filter dropdowns berfungsi
3. Event cards menampilkan informasi yang benar
4. Responsive layout di berbagai viewport

### Test File Structure

```
tests/
├── unit/
│   └── events-filter.test.ts    # Unit tests untuk filter logic
└── events-list.spec.ts          # Playwright E2E tests
```
