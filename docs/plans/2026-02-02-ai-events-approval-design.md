# AI Events Approval System - Design Document

**Date:** 2026-02-02  
**Status:** Ready for Implementation  
**Related:** Admin Dashboard, AI Events Feature

---

## Overview

Implementasi sistem approval untuk AI Events yang memungkinkan admin melihat, menyetujui, atau menolak event yang diajukan oleh user melalui admin dashboard di `/dashboard`.

---

## Goals

1. Admin dapat melihat semua event dengan status `approved = false` (pending)
2. Admin dapat approve event dengan satu klik
3. Admin dapat reject event (delete permanen) dengan konfirmasi
4. UI konsisten dengan design system VibeDev ID yang sudah ada
5. Performa optimal dengan indexing database yang proper

---

## Architecture

### Database Schema

**Table:** `events` (existing)

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `slug` | text | URL-friendly identifier |
| `name` | text | Event name |
| `description` | text | Event description |
| `date` | date | Event date |
| `time` | text | Event time |
| `location_type` | text | online/offline/hybrid |
| `location_detail` | text | Location details |
| `organizer` | text | Event organizer |
| `registration_url` | text | Registration link |
| `cover_image` | text | Cover image URL |
| `category` | text | Event category |
| `status` | text | upcoming/ongoing/past |
| `approved` | boolean | Approval status (false = pending) |
| `submitted_by` | uuid | User who submitted the event |
| `created_at` | timestamp | Submission timestamp |

**Indexes Added:**
```sql
-- Partial index for pending events (critical for approval dashboard)
CREATE INDEX idx_events_pending_created ON events (created_at DESC) WHERE approved = false;

-- Foreign key index for user lookups
CREATE INDEX idx_events_submitted_by ON events (submitted_by);

-- Covering index for public event listings
CREATE INDEX idx_events_approved_category_date ON events (approved, category, date) 
  INCLUDE (name, slug, location_type, cover_image, status);

-- Partial index for chronological listings
CREATE INDEX idx_events_approved_date ON events (date ASC) WHERE approved = true;
```

---

## Server Actions

### Location: `lib/actions/events.ts`

#### 1. `getPendingEvents()`

**Purpose:** Fetch all events awaiting approval

**Authentication:** Requires admin role (user_metadata.role === 0)

**Query:**
```typescript
const { data, error } = await supabase
  .from('events')
  .select('*, users:submitted_by(display_name, email)')
  .eq('approved', false)
  .order('created_at', { ascending: false })
```

**Returns:** `{ events: AIEvent[], error?: string }`

---

#### 2. `approveEvent(eventId: string)`

**Purpose:** Approve a pending event

**Authentication:** Requires admin role

**Logic:**
1. Verify admin status
2. Update `approved = true` where `id = eventId`
3. Revalidate paths: `/dashboard`, `/event/list`

**Returns:** `{ success: boolean, error?: string }`

---

#### 3. `rejectEvent(eventId: string)`

**Purpose:** Reject and permanently delete an event

**Authentication:** Requires admin role

**Logic:**
1. Verify admin status
2. Delete event where `id = eventId`
3. Revalidate path: `/dashboard`

**Returns:** `{ success: boolean, error?: string }`

---

## UI Components

### File Structure

```
app/(admin)/dashboard/
├── boards/
│   └── events-approval/
│       ├── page.tsx                    # Main board page
│       └── components/
│           └── pending-events-table.tsx # Data table with actions
├── page.tsx                            # Updated with new tab
└── ...
```

### Component: `PendingEventsTable`

**Framework:** TanStack Table (consistent dengan payments.tsx existing)

**Features:**
- Data table dengan kolom: Event Name, Category, Date, Organizer, Actions
- Badge untuk Category
- Dual action buttons: Approve (primary) & Reject (destructive)
- Loading state saat processing
- Empty state saat tidak ada pending events
- Toast notifications untuk feedback

**Columns:**
| Column | Type | Content |
|--------|------|---------|
| Event Name | text | event.name |
| Category | badge | event.category (variant: secondary) |
| Date | formatted date | event.date (id-ID locale) |
| Organizer | text | event.organizer |
| Actions | buttons | Approve + Reject |

**Interactions:**
- **Approve:** Trigger `approveEvent()`, show success toast, refresh data
- **Reject:** Show confirmation dialog, trigger `rejectEvent()`, show success toast, refresh data
- **Processing state:** Disable buttons saat action berjalan

**Empty State:**
```
No pending events
All events have been reviewed
```

**Styling:**
- Card container (consistent dengan design system)
- Table with rounded-md border
- Primary button (default variant) untuk Approve
- Destructive button untuk Reject
- Muted text untuk empty state

---

## Page Integration

### Tab Addition to Dashboard

**Location:** `app/(admin)/dashboard/page.tsx`

**New Tab:**
```tsx
<TabsTrigger
  value="events-approval"
  className="flex items-center gap-2"
>
  <IconCalendarEvent size={16} />
  Events
</TabsTrigger>
```

**Tab Content:**
```tsx
<TabsContent
  value="events-approval"
  className="space-y-4"
>
  <EventsApprovalPage />
</TabsContent>
```

---

## Security Considerations

1. **Authentication Check:** All server actions verify `user_metadata.role === 0`
2. **Authorization:** Non-admin users get "Unauthorized" error
3. **Confirmation:** Reject action requires browser confirmation dialog
4. **Input Validation:** Event ID validated as string parameter

---

## Performance Optimization

1. **Partial Index:** `idx_events_pending_created` ensures fast query untuk pending events
2. **Revalidation:** Smart cache invalidation setelah approve/reject
3. **Server Components:** Data fetching di server side
4. **Client Refresh:** `router.refresh()` untuk update UI setelah mutation

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Unauthorized | Return error message, no action taken |
| Database error | Log error, return user-friendly message |
| Network failure | Toast error, keep UI state |
| Invalid event ID | Validation error |

---

## Success Criteria

- [ ] Admin dapat melihat list event pending
- [ ] Admin dapat approve event dengan satu klik
- [ ] Admin dapat reject event dengan konfirmasi
- [ ] Event yang diapprove muncul di public event list
- [ ] Event yang direject dihapus dari database
- [ ] UI responsive dan konsisten dengan design system
- [ ] Toast notifications untuk semua actions
- [ ] Loading states saat processing

---

## Implementation Order

1. **Database:** Apply migration `17_add_events_approval_indexes.sql`
2. **Server Actions:** Add 3 functions to `lib/actions/events.ts`
3. **UI Component:** Create `pending-events-table.tsx`
4. **Board Page:** Create `events-approval/page.tsx`
5. **Dashboard:** Update `dashboard/page.tsx` dengan tab baru
6. **Testing:** Verify flow end-to-end

---

## Migration File

**File:** `scripts/17_add_events_approval_indexes.sql`

```sql
-- Migration: Add indexes for AI Events approval system
-- Date: 2025-02-02

-- Partial index for pending events
CREATE INDEX IF NOT EXISTS idx_events_pending_created 
ON events (created_at DESC) 
WHERE approved = false;

-- Foreign key index for submitted_by
CREATE INDEX IF NOT EXISTS idx_events_submitted_by 
ON events (submitted_by);

-- Covering index for public listings
CREATE INDEX IF NOT EXISTS idx_events_approved_category_date 
ON events (approved, category, date) 
INCLUDE (name, slug, location_type, cover_image, status);

-- Partial index for chronological listings
CREATE INDEX IF NOT EXISTS idx_events_approved_date 
ON events (date ASC) 
WHERE approved = true;

-- Comments
COMMENT ON INDEX idx_events_pending_created IS 'Partial index for admin approval dashboard - pending events only';
COMMENT ON INDEX idx_events_submitted_by IS 'Foreign key index for user-event relationship lookups';
COMMENT ON INDEX idx_events_approved_category_date IS 'Covering index for public event listings with category filter';
COMMENT ON INDEX idx_events_approved_date IS 'Partial index for chronological event listings';
```

---

## Notes

- **Simple Approach:** Reject = delete permanen (Option 1 dari brainstorming)
- **No Audit Trail:** Tidak menyimpan siapa yang approve/reject (sesuai requirement simple)
- **Admin Check Pattern:** Menggunakan `user_metadata.role === 0` (consistent dengan blog.ts)
- **Revalidation:** Path `/dashboard` dan `/event/list` di-revalidate setelah mutation
