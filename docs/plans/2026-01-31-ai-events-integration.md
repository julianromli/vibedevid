# AI Events Real Data Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock data in the "AI Events" feature with a real Supabase database implementation, including schema creation, server actions, and UI integration.

**Architecture:**
- **Database:** New `events` table in Supabase with RLS policies for public read and authenticated submission.
- **Backend:** Next.js Server Actions for fetching and submitting events (`lib/actions/events.ts`).
- **Frontend:**
    - Server-side initial data fetching in `app/event/list/page.tsx`.
    - Client-side filtering via URL search params (router.push) or client-side filtering of server-fetched data (depending on scale; starting with server-side filtering for scalability).
    - `SubmitEventModal` integrated with `submitEvent` action.

**Tech Stack:** Next.js 16 (Server Actions), Supabase (Postgres), TypeScript, Tailwind CSS.

---

### Task 1: Database Schema & Migration

**Files:**
- Create: `scripts/migrations/00_create_events_table.sql` (conceptually, to be executed via MCP)

**Step 1: Define Migration SQL**
Create a SQL migration to:
1.  Create `events` table with appropriate columns matching `types/events.ts`.
2.  Enable RLS.
3.  Add Policy: "Public can view approved/upcoming events".
4.  Add Policy: "Authenticated users can insert events" (with `approved = false` default).
5.  Add indexes on `category`, `location_type`, `date`.

**Step 2: Apply Migration**
Run the migration using `supabase-vibedevid_apply_migration`.

**Step 3: Verify Table**
List tables to confirm `events` exists.

---

### Task 2: Event Server Actions

**Files:**
- Create: `lib/actions/events.ts`
- Modify: `types/events.ts` (Ensure optional fields match DB)

**Step 1: Create `getEvents` action**
Implement `getEvents` that accepts filters (category, location, etc.) and returns `Promise<{ data: AIEvent[], error: string | null }>`.
- Use `supabase-postgres-best-practices`: Select specific columns, use proper indexes.

**Step 2: Create `submitEvent` action**
Implement `submitEvent` that accepts `EventFormData` (or `FormData`), validates input, and inserts into `events` table.
- Should set `approved: false` and `created_by: user.id`.
- Return success/error state.

**Step 3: Create `getEventBySlug` action**
Implement fetching a single event for potential detail pages (future proofing).

---

### Task 3: Integrate Event List Page

**Files:**
- Modify: `app/event/list/page.tsx`
- Modify: `app/event/list/event-list-client.tsx`

**Step 1: Server-Side Fetching**
In `page.tsx`:
- Fetch initial events using `getEvents`.
- Pass events to `EventListClient`.

**Step 2: Client-Side Updates**
In `event-list-client.tsx`:
- Replace `mockEvents` import with `initialEvents` prop.
- **Option A (Simple):** Keep client-side filtering if dataset is small (<100).
- **Option B (Scalable):** Update filters to use URL search params and trigger re-fetch (via router.refresh or passing searchParams to page).
*Decision:* Start with **Option A** (Client-side filtering of initial data) for smoother UX since the initial dataset will be small, but architect props to allow easy switch to Server-side filtering later.

**Step 3: Verify Data Display**
Check if events render correctly.

---

### Task 4: Integrate Submit Event Modal

**Files:**
- Modify: `components/event/submit-event-modal.tsx`

**Step 1: Wire up Server Action**
- Import `submitEvent` from `lib/actions/events.ts`.
- Call `submitEvent` in `onSubmit`.

**Step 2: Handle Loading/Error/Success**
- Show toast notifications (sonner) for success/error.
- Close modal on success.

**Step 3: Test Submission**
- Log in.
- Submit a test event.
- Verify in database that it exists (and is unapproved).

---

### Task 5: Seed Data (Optional but Recommended)

**Files:**
- Create: `scripts/seed_events.ts` (or run direct SQL)

**Step 1: Insert Mock Data**
Insert the data from `lib/data/mock-events.ts` into the real database so the page isn't empty.
