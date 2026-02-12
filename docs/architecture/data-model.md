# Data Model Overview

## Scope

This document focuses on the entities and access rules involved in the admin event approval flow (`/dashboard` -> Events tab) and public event listing (`/event/list`).

## Core Entities

### `users`

- `id` (uuid, PK)
- `role` (number): `0 = admin`, `1 = moderator`, `2 = user`

### `events`

- `id` (uuid, PK)
- `slug` (text)
- `name` (text)
- `description` (text)
- `date` (date)
- `time` (text)
- `location_type` (text)
- `location_detail` (text)
- `organizer` (text)
- `registration_url` (text)
- `cover_image` (text)
- `category` (text)
- `status` (text: `upcoming | ongoing | past`)
- `approved` (boolean)
- `submitted_by` (uuid, FK -> `users.id`)
- `created_at` (timestamptz)

## Read/Write Paths

### Public event list

- Server action: `getEvents()` in `lib/actions/events.ts`
- Query condition: `approved = true`
- Route usage: `/event/list`

### Admin pending event list

- Server action: `getPendingEvents()` in `lib/actions/events.ts`
- Query condition: `approved = false`
- Route usage: `/dashboard` tab `events-approval`

### Admin approval/rejection mutations

- Server actions:
  - `approveEvent(eventId)` -> `UPDATE events SET approved = true WHERE id = ?`
  - `rejectEvent(eventId)` -> `DELETE FROM events WHERE id = ?`

## RLS Policies (Events)

Current policies on `public.events`:

1. `SELECT` public rows where `approved = true`
2. `INSERT` for authenticated users with `auth.uid() = submitted_by`
3. `SELECT` for authenticated users on own pending rows (`auth.uid() = submitted_by`)

Observed gap:

- No `UPDATE` policy on `events`
- No `DELETE` policy on `events`

Implication:

- Approve/reject actions can return no SQL error but mutate zero rows under RLS, unless server action verifies affected row count.

## Indexes Relevant to Event Approval

- `idx_events_pending_created` on `(created_at DESC)` where `approved = false`
- `idx_events_submitted_by` on `(submitted_by)`
- `idx_events_approved_category_date` on `(approved, category, date)` include `(name, slug, location_type, cover_image, status)`
- `idx_events_approved_date` on `(date ASC)` where `approved = true`

## End-to-End Flow

1. Admin clicks Approve/Reject on `/dashboard`.
2. Client calls server action (`approveEvent` / `rejectEvent`).
3. Server action validates auth and attempts mutation on `events`.
4. UI shows toast based on `{ success, error }` payload.
5. `router.refresh()` reloads pending table.
6. Public page `/event/list` only shows rows with `approved = true`.

If step 3 affects zero rows, step 4 can still show success unless mutation result is validated.
