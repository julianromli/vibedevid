# Authorization Model (Post-Neon Migration)

> **Updated:** June 2026 — migrated from Supabase RLS to application-layer authorization.

## Overview

Row Level Security (RLS) has been **removed**. All database access goes through **server-side Drizzle queries** on Cloudflare Workers. Authorization is enforced in TypeScript before any mutation or sensitive read.

## Auth stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Identity  | Better Auth (`user`, `account`, `session`, `verification` tables) |
| Profile   | `public.users` (1:1 with Better Auth user ID)                     |
| Session   | Better Auth cookies via `tanstackStartCookies()` plugin           |
| DB access | Drizzle ORM + Neon Postgres (HTTP driver)                         |

## Role model

`public.users.role`:

| Value | Role                  |
| ----- | --------------------- |
| `0`   | Admin                 |
| `1`   | Moderator             |
| `2`   | Normal user (default) |

## Server helpers (`lib/server/auth.ts`, `lib/auth/permissions.ts`)

| Helper                          | Purpose                                       |
| ------------------------------- | --------------------------------------------- |
| `getServerSession()`            | Read Better Auth session from request headers |
| `getCurrentUser()`              | Session + `public.users` profile              |
| `requireUser()`                 | Throw if not authenticated                    |
| `requireCurrentUser()`          | Throw if no profile                           |
| `requireAdminOrModeratorUser()` | Throw unless role 0 or 1                      |
| `requireAdmin()`                | Throw unless role 0                           |
| `isAdminOrModerator(role)`      | Boolean check                                 |

## Rules

1. **No client-side DB writes** — likes, comments, uploads go through `createServerFn` or API routes.
2. **Every mutation** must call `requireUser()` or stricter helper at the start.
3. **Admin operations** must call `requireAdminOrModeratorUser()` or `requireAdmin()`.
4. **Ownership checks** — e.g. `checkProjectOwnership(username, userId)` before edit/delete.
5. **No service-role bypass** — the old Supabase `SUPABASE_SERVICE_ROLE_KEY` pattern is removed.

## Public reads

Published content (projects, blog posts, events, profiles) is fetched via server loaders with Drizzle. No anonymous PostgREST access.

## Migration from RLS

Previous policies used `auth.uid()` and `is_admin_or_moderator()`. Equivalent checks now live in:

- `lib/auth/permissions.ts` — role helpers
- `lib/server/auth.ts` — session + profile
- Each `lib/actions/*.ts` file — per-operation guards

See [Neon migration guide](../migrations/neon-better-auth.md) for setup and data migration steps.
