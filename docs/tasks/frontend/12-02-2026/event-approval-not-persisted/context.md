# Bug Context: Event Approval Not Persisted

## User Report

- Description: Admin approves event from `/dashboard`, success toast appears, but approve/reject buttons remain and event is not visible on public event page.
- Expected: Approved event disappears from pending table and appears on `/event/list`.
- Actual: UI reports success, but data is unchanged.

## Affected Area

- UI: `app/(admin)/dashboard/boards/events-approval/components/pending-events-table.tsx`
- Server actions: `lib/actions/events.ts`
- Public read flow: `getEvents()` in `lib/actions/events.ts`

## Architecture Context

- Entity flow: Dashboard UI -> server action (`approveEvent`/`rejectEvent`) -> Supabase `events` table
- Public visibility depends on `events.approved = true`
- Events table is protected by RLS

## Data Model Notes

From `docs/architecture/data-model.md` and runtime policy check:

- Existing `events` policies include `SELECT` and `INSERT`
- No `UPDATE`/`DELETE` policy for admin moderation path

## Initial Reproduction Plan

1. Open `/dashboard` Events tab as admin.
2. Click Approve for pending event.
3. Observe success toast.
4. Observe row still pending after refresh and absent in `/event/list`.

## Diagnostic Strategy

- Add server instrumentation to log auth context, DB role, and mutation affected rows.
- Add UI instrumentation to log server action response payload.
- Verify RLS policy surface directly from Postgres.
