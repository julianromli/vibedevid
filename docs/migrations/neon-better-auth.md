# Neon + Better Auth Migration Guide

## Prerequisites

- Neon project with `DATABASE_URL` (pooled connection string)
- Supabase direct DB URL for one-time data copy: `SUPABASE_DB_URL`
- Better Auth secrets: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- OAuth: `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`

## Steps

### 1. Apply schema

```bash
bun run migrate:schema
```

Creates Better Auth tables, all `public.*` app tables, migration checkpoints, and the
database trigger that creates `public.users` profiles when Better Auth inserts into
`"user"`.

### 2. Stage Supabase auth users

```bash
SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres" \
  bun run migrate:staging -- --force
```

Copies `auth.users` and `auth.identities` into `supabase_auth_staging`. This phase
truncates staging tables, so pass `--force` or set `MIGRATE_CONFIRM=destroy`.

### 3. Migrate users to Better Auth

```bash
bun run migrate:users
```

Imports users with bcrypt password hashes + Google/GitHub OAuth identities. User IDs
are preserved, and account rows are upserted by `(user_id, provider_id)` for safe
reruns.

### 4. Copy public data

```bash
bun run migrate:data -- --force
```

Copies all `public.*` tables. This phase truncates target public data before import,
so pass `--force` or set `MIGRATE_CONFIRM=destroy`. For insert-only reruns, use:

```bash
bun run migrate:data -- --append
```

To copy only specific tables:

```bash
bun run migrate:data -- --tables=projects,posts
```

### 5. Verify

```bash
bun run migrate:verify -- --fail-on-mismatch
```

- User count: `SELECT COUNT(*) FROM "user";`
- Profile count: `SELECT COUNT(*) FROM users;`
- Login with existing email/password
- Login with Google/GitHub (links to same account)

### One-command runner

```bash
bun run migrate:run
```

`migrate:run` executes `schema → staging → users → data → verify` and skips phases
with checkpoints. Use `bun run migrate:status` to inspect checkpoints and current
Neon counts. Use `--force` to rerun a checkpointed phase intentionally.

### 6. Update deployment env

Remove all `SUPABASE_*` vars. Set `DATABASE_URL`, `BETTER_AUTH_*`, OAuth keys on Cloudflare Workers.

### 7. Pause Supabase project

After production verification, pause the Supabase project to save costs.

## OAuth redirect URLs

Add to Google/GitHub OAuth apps:

```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/callback/github
```
