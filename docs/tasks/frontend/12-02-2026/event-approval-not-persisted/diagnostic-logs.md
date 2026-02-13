# Diagnostic Logs: Event Approval Not Persisted

## Instrumentation Added

### UI Layer

- File: `app/(admin)/dashboard/boards/events-approval/components/pending-events-table.tsx`
- Logs:
  - `[events-approval-debug] handleApprove start/result`
  - `[events-approval-debug] handleReject start/result`

### Server Layer

- File: `lib/actions/events.ts`
- Logs:
  - Auth context (`userId`, `user_metadata.role`)
  - DB role lookup (`users.role`)
  - Mutation result with affected row count for approve/reject

## Database Evidence

Executed SQL:

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'events'
order by policyname;
```

Result:

```json
[
  {
    "policyname": "Authenticated users can submit events",
    "cmd": "INSERT",
    "roles": "{authenticated}",
    "qual": null,
    "with_check": "(( SELECT auth.uid() AS uid) = submitted_by)"
  },
  {
    "policyname": "Public events are viewable by everyone",
    "cmd": "SELECT",
    "roles": "{public}",
    "qual": "(approved = true)",
    "with_check": null
  },
  {
    "policyname": "Users can view their own pending events",
    "cmd": "SELECT",
    "roles": "{authenticated}",
    "qual": "(( SELECT auth.uid() AS uid) = submitted_by)",
    "with_check": null
  }
]
```

## Key Observation

- `events` table has no `UPDATE` and no `DELETE` policy.
- Admin moderation actions currently perform `UPDATE`/`DELETE`.
- This aligns with behavior where mutation affects zero rows while UI still treats result as success.

## Reproduction Outcome

- Status: Reproduced by architecture + policy validation and flow analysis.
- Confidence: High.
