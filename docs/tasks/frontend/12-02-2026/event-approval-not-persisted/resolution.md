# Bug Resolution: Event Approval Not Persisted

## Summary

Fixed admin event moderation flow where `/dashboard` showed success toast but approve/reject did not persist in database.

## Root Cause

1. `events` table lacked RLS policies for `UPDATE` and `DELETE`.
2. Server actions treated mutation as success when no rows were affected.

This caused false-positive success feedback in UI while data remained unchanged.

## Fix Implemented

1. Added RLS policies for admin/moderator moderation on `events`:
   - `Admins can update events`
   - `Admins can delete events`
2. Strengthened admin authorization in event actions by checking `users.role` in DB.
3. Added mutation affected-row validation in `approveEvent` and `rejectEvent`.
4. Removed temporary diagnostic instrumentation.

## Files Changed

- `lib/actions/events.ts`
- `scripts/20_add_events_admin_moderation_rls.sql`
- `docs/security/RLS_POLICIES.md`
- `docs/architecture/data-model.md`
- `docs/tasks/frontend/12-02-2026/event-approval-not-persisted/context.md`
- `docs/tasks/frontend/12-02-2026/event-approval-not-persisted/diagnostic-logs.md`

## Verification

- Database migration applied successfully (`add_events_admin_moderation_rls_v2`).
- Verified `events` now has `UPDATE` and `DELETE` policies.
- Prettier formatting check passes on changed TS/Markdown files.

## Notes

- ESLint is not configured in this repository (`eslint.config.*` missing), so lint verification via ESLint could not run.
- Existing global TypeScript errors in unrelated files remain outside this bugfix scope.
