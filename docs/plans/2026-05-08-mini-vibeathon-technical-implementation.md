# Mini Vibeathon Technical Implementation Plan

Date: 2026-05-08
Status: Approved

## Goal

Implement a reusable competition system for VibeDev ID with a polished public landing page, authenticated submission flow, Product Hunt-style public feed, detail pages with comments and voting, and an admin workflow for moderation and judging.

This document turns the approved product specification into an implementation-ready technical blueprint for the current codebase.

## Locked Product Decisions

- Competition name: **Mini Vibeathon**
- Tagline: **Dari ide ke demo, dalam 7 hari**
- Active period: **2026-05-09** through **2026-05-16**
- Prize: **Cursor Credits**
- Language: **Bahasa Indonesia only**
- `/competition` shows the **single active competition**
- `/competition/list` shows entries for the **active competition only**
- `/competition/submit` requires authentication
- Users create **new entries**, not project-linked submissions
- Users may submit **up to 3 entries per competition**
- Entries are **public immediately**
- Entries **cannot be edited**
- During an active competition, submitters may **delete an entry and resubmit**
- Voting requires authentication
- Self-voting is forbidden
- One user may cast **one vote per entry**, across many entries
- Voting is open only while the competition is active
- Winner selection is **70% judges, 30% public vote**
- Comments are public to read and require auth to write
- Comments live on the **entry detail page**
- Phase 1 supports a single active competition UI, but the schema must support future competitions

---

## Why This Must Be a Separate Domain

The existing `projects` flow is useful for visual patterns, but it is not a safe or clean base for competition data:

- project likes are scoped to `projects`, not competition entries
- project reads are public without competition-specific lifecycle rules
- comments currently support `post` and `project` only
- competition needs its own submission cap, vote constraints, judging, and moderation states

Therefore the implementation should create a dedicated competition domain instead of extending `projects` directly.

---

## Reuse Map from the Existing Codebase

### Reuse directly

- Navbar/Footer layout patterns from public pages
- auth gate pattern from `app/project/submit/page.tsx`
- public listing composition pattern from `app/project/list/page.tsx`
- list client/query param sync pattern from `app/project/list/project-list-client.tsx`
- shared primitives in `components/ui/*`
- Uploadthing/media handling patterns from the project submission flow
- admin board layout and conventions in `app/(admin)/dashboard/boards/*`

### Extend carefully

- `components/ui/comment-section.tsx`
- `lib/actions/comments.ts`
- `types/comments.ts`

### Do not reuse as-is

- project likes / project sorting functions
- project submission persistence layer
- project public fetchers without competition visibility rules

---

## Proposed File Layout

### Database and migrations

- `scripts/23_add_competitions_tables.sql`
- `scripts/24_extend_comments_for_competition_entries.sql`
- `scripts/25_seed_mini_vibeathon.sql`

### Types

- `types/competition.ts`
- `types/comments.ts` (extend existing union)

### Public/server data layer

- `lib/server/competition-public.ts`
- `lib/actions/competition.ts`
- `lib/actions/comments.ts` (extend entity support)

### Public routes

- `app/competition/page.tsx`
- `app/competition/list/page.tsx`
- `app/competition/list/competition-list-client.tsx`
- `app/competition/submit/page.tsx`
- `app/competition/[slug]/page.tsx`

### Public components

- `components/competition/competition-hero.tsx`
- `components/competition/competition-timeline.tsx`
- `components/competition/competition-rules.tsx`
- `components/competition/competition-faq.tsx`
- `components/competition/competition-submit-form.tsx`
- `components/competition/competition-submit-preview.tsx`
- `components/competition/competition-entry-feed.tsx`
- `components/competition/competition-entry-card.tsx`
- `components/competition/competition-vote-button.tsx`
- `components/competition/competition-sort-controls.tsx`

### Admin components and routes

- `app/(admin)/dashboard/boards/competitions/page.tsx`
- `app/(admin)/dashboard/boards/competitions/components/competition-overview.tsx`
- `app/(admin)/dashboard/boards/competitions/components/competition-entries-table.tsx`
- `app/(admin)/dashboard/boards/competitions/components/competition-judge-panel.tsx`
- `app/(admin)/dashboard/boards/competitions/components/competition-vote-audit-table.tsx`

### Supporting changes

- `app/sitemap.ts`
- `messages/id.json`
- `docs/README.md`

---

## Data Model

## 1) `competitions`

Represents reusable competition events. The public site only shows one active competition, but this table supports historical and future competitions.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | default `gen_random_uuid()` |
| `slug` | `text` unique | e.g. `mini-vibeathon-2026` |
| `title` | `text` | `Mini Vibeathon` |
| `tagline` | `text` | `Dari ide ke demo, dalam 7 hari` |
| `description` | `text` | hero/about copy |
| `prize_text` | `text` | `Cursor Credits` |
| `starts_at` | `timestamptz` | submission/vote start |
| `ends_at` | `timestamptz` | submission/vote end |
| `status` | `text` | `draft \| active \| closed \| archived` |
| `rules_markdown` | `text` | rendered on landing page |
| `judging_criteria_markdown` | `text` | rendered on landing page |
| `faq_items` | `jsonb` | structured FAQ |
| `timeline_items` | `jsonb` | structured timeline |
| `hero_primary_cta_label` | `text` | optional, defaults from UI |
| `hero_secondary_cta_label` | `text` | optional |
| `judging_vote_weight` | `numeric` | default `0.30` |
| `judging_judge_weight` | `numeric` | default `0.70` |
| `created_by` | `uuid` fk `auth.users` | nullable on delete |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Constraints:

- `starts_at < ends_at`
- valid `status`
- weights sum to `1.0`

Indexes:

- unique index on `slug`
- index on `(status, starts_at desc)`
- index on `(status, ends_at desc)`

## 2) `competition_categories`

Competition-specific categories should not reuse the global project categories, because each event may want different framing and ordering.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | |
| `competition_id` | `uuid` fk `competitions(id)` | cascade delete |
| `slug` | `text` | stable value for filtering |
| `label` | `text` | public display text |
| `description` | `text` nullable | optional help copy |
| `sort_order` | `integer` | UI ordering |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamptz` | |

Constraints:

- unique `(competition_id, slug)`

Indexes:

- index on `(competition_id, sort_order)`

## 3) `competition_entries`

Stores public submissions.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | |
| `competition_id` | `uuid` fk `competitions(id)` | cascade delete |
| `user_id` | `uuid` fk `auth.users` | cascade delete |
| `category_id` | `uuid` fk `competition_categories(id)` | restrict delete |
| `slug` | `text` unique | shareable detail route |
| `title` | `text` | required |
| `tagline` | `text` | required |
| `description` | `text` | main write-up |
| `process_summary` | `text` | vibe coding process |
| `ai_tools_used` | `text[]` | tools/tags |
| `tech_stacks` | `text[]` | max 8 values |
| `demo_url` | `text` | must be https |
| `repo_url` | `text` | must be https |
| `thumbnail_url` | `text` | required |
| `thumbnail_key` | `text` | Uploadthing cleanup |
| `gallery_urls` | `text[]` | max 5 |
| `gallery_keys` | `text[]` | paired with URLs |
| `video_url` | `text` nullable | YouTube/Loom |
| `comment_count` | `integer` | default `0`, optional denormalized field |
| `vote_count` | `integer` | default `0`, optional denormalized field |
| `status` | `text` | `published \| hidden \| disqualified` |
| `is_featured` | `boolean` | admin pinning |
| `is_finalist` | `boolean` | admin flag |
| `is_winner` | `boolean` | admin flag |
| `comments_locked` | `boolean` | admin moderation |
| `submitted_at` | `timestamptz` | immutable business timestamp |
| `deleted_at` | `timestamptz` nullable | soft-delete optional |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Constraints:

- valid `status`
- `demo_url` and `repo_url` must use `https://`
- cardinality checks for `tech_stacks`, `gallery_urls`, `gallery_keys`
- `array_length(gallery_urls, 1) <= 5`
- `array_length(tech_stacks, 1) <= 8`
- at least one of `video_url` or `gallery_urls` present

Business rules enforced in actions:

- competition must be active
- user may submit at most 3 entries per competition
- entry cannot be edited once created
- user may delete own entry only while competition is active
- self-voting blocked at action and UI level

Indexes:

- unique index on `slug`
- index on `(competition_id, created_at desc)` for newest
- index on `(competition_id, created_at asc)` for oldest
- partial index on `(competition_id, vote_count desc, created_at asc)` where `status = 'published'`
- partial index on `(competition_id, is_featured, created_at desc)` where `status = 'published'`
- index on `(competition_id, category_id, created_at desc)`
- index on `(competition_id, user_id)`

## 4) `competition_votes`

Dedicated vote table for competition entries.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | |
| `competition_entry_id` | `uuid` fk `competition_entries(id)` | cascade delete |
| `competition_id` | `uuid` fk `competitions(id)` | denormalized for reporting |
| `user_id` | `uuid` fk `auth.users` | cascade delete |
| `created_at` | `timestamptz` | default `now()` |

Constraints:

- unique `(competition_entry_id, user_id)`

Indexes:

- index on `competition_entry_id`
- index on `(competition_id, created_at desc)`
- index on `(user_id, created_at desc)`

## 5) `competition_judge_scores`

Stores per-judge scoring and notes.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | |
| `competition_entry_id` | `uuid` fk `competition_entries(id)` | cascade delete |
| `competition_id` | `uuid` fk `competitions(id)` | denormalized |
| `judge_user_id` | `uuid` fk `public.users(id)` | app user profile id |
| `execution_score` | `numeric(5,2)` | 0-100 or 0-10 normalized |
| `creativity_score` | `numeric(5,2)` | |
| `ai_usage_score` | `numeric(5,2)` | |
| `ux_score` | `numeric(5,2)` | |
| `completeness_score` | `numeric(5,2)` | |
| `notes` | `text` | internal only |
| `total_score` | `numeric(6,2)` | derived and stored |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Constraints:

- unique `(competition_entry_id, judge_user_id)`

Indexes:

- index on `(competition_id, competition_entry_id)`
- index on `(judge_user_id, created_at desc)`

## 6) `competition_entry_reports`

Optional in phase 1 but recommended in schema now.

Suggested columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` pk | |
| `competition_entry_id` | `uuid` fk `competition_entries(id)` | cascade delete |
| `reporter_user_id` | `uuid` fk `auth.users` | cascade delete |
| `reason` | `text` | enum later if needed |
| `created_at` | `timestamptz` | |

Constraints:

- unique `(competition_entry_id, reporter_user_id)`

## 7) Extend `comments`

Preferred implementation: extend the existing unified comment system instead of creating a second UI stack.

Migration changes:

- add nullable `competition_entry_id uuid references public.competition_entries(id) on delete cascade`
- update the "single target" invariant so a comment points to exactly one of:
  - `post_id`
  - `project_id`
  - `competition_entry_id`
- add composite index on `(competition_entry_id, created_at desc)`
- update relevant RLS policies to allow public reads and authenticated writes on competition comments

Application changes:

- `types/comments.ts`: add `'competition'` to `CommentEntityType`
- `lib/actions/comments.ts`: route inserts/selects to `competition_entry_id`
- `components/ui/comment-section.tsx`: no major structural rewrite required

---

## Migration Plan

## `scripts/23_add_competitions_tables.sql`

Contents:

- create `competitions`
- create `competition_categories`
- create `competition_entries`
- create `competition_votes`
- create `competition_judge_scores`
- create `competition_entry_reports`
- create indexes
- enable RLS
- create triggers for `updated_at`

RLS intent:

- `competitions`: public read, admin-only write
- `competition_categories`: public read, admin-only write
- `competition_entries`:
  - public read for `published`
  - owner read for own hidden/disqualified entries if needed
  - insert only by authenticated owner during active competition
  - owner delete during active competition
  - no owner update policy for public content edits
- `competition_votes`:
  - public read
  - authenticated insert/delete only by owner during active competition
- `competition_judge_scores`: judge/admin read-write only
- `competition_entry_reports`: reporter insert, admin read

## `scripts/24_extend_comments_for_competition_entries.sql`

Contents:

- add `competition_entry_id`
- update check constraints
- add new index
- update comment RLS policies if needed

## `scripts/25_seed_mini_vibeathon.sql`

Contents:

- create active competition row for Mini Vibeathon
- create category rows for the active competition
- seed landing page sections and FAQ JSON content

Suggested initial categories:

- AI Apps
- Developer Tools
- Productivity
- Education
- Automation
- Creative Tools
- SaaS
- Consumer

---

## RLS and Authorization Rules

## Public reads

- landing page and list page must read only the active competition and `published` entries
- ended competition pages remain public

## Authenticated submitters

- may insert entries only while `competition.status = 'active'` and `starts_at <= now() < ends_at`
- may delete only their own entries during the active window
- may not update entry content after creation

## Voters

- must be authenticated
- may not vote their own entries
- may vote only while competition is active
- duplicate votes prevented by unique constraint

## Admins

- manage competition content, entry states, judge results, and exports
- for phase 1, keep admin write access aligned with the existing admin-only dashboard layout

If moderator support is needed later, expand `app/(admin)/layout.tsx` and action role checks together in the same change.

---

## Public Data Access Layer

Create a read-focused server module at `lib/server/competition-public.ts`.

Suggested functions:

- `getActiveCompetition()`
- `getCompetitionLandingData(slugOrActive?: string)`
- `getCompetitionCategories(competitionId: string)`
- `getCompetitionEntries(params)`
- `getCompetitionEntryBySlug(slug: string)`
- `getCompetitionEntryVoteState(entryIds: string[], userId?: string)`
- `getCompetitionEntryCommentsCount(entryIds: string[])`

Implementation notes:

- use `unstable_cache` or cache tags for high-read public queries
- revalidate by tag after submit, delete, vote, judge state changes, and moderation
- prefer a dedicated read module instead of pushing all queries into client components

Recommended cache tags:

- `competition:active`
- `competition:{competitionId}:landing`
- `competition:{competitionId}:entries`
- `competition:entry:{entryId}`

---

## Server Actions

Create `lib/actions/competition.ts` with `'use server'`.

Suggested actions:

### Public/authenticated user actions

- `submitCompetitionEntry(formData: FormData)`
- `deleteCompetitionEntry(entryId: string)`
- `toggleCompetitionVote(entryId: string)`
- `reportCompetitionEntry(entryId: string, reason: string)`
- `getCurrentUserCompetitionEntryCount(competitionId: string)`

### Admin/judge actions

- `hideCompetitionEntry(entryId: string)`
- `disqualifyCompetitionEntry(entryId: string, reason?: string)`
- `featureCompetitionEntry(entryId: string, featured: boolean)`
- `lockCompetitionEntryComments(entryId: string, locked: boolean)`
- `markCompetitionEntryFinalist(entryId: string, finalist: boolean)`
- `markCompetitionEntryWinner(entryId: string, winner: boolean)`
- `saveCompetitionJudgeScore(input)`
- `recomputeCompetitionLeaderboard(competitionId: string)`
- `exportCompetitionEntriesCsv(competitionId: string)`

### Validation helpers

- `validateCompetitionEntryInput(input)`
- `validateCompetitionMedia(input)`
- `assertCompetitionIsActive(competition)`
- `assertUserCanVote({ entry, userId })`

Return shape conventions:

- `{ success: boolean, error?: string, fieldErrors?: Record<string, string> }`

This matches the repo's existing server-action style and keeps forms predictable.

---

## Input Validation Rules

Validation should happen on both client and server. Server validation is canonical.

## Entry validation

- `title`: required, trimmed, max length e.g. 120
- `tagline`: required, trimmed, max length e.g. 160
- `description`: required, min and max length
- `process_summary`: required, min and max length
- `demo_url`: required, valid https URL
- `repo_url`: required, valid https URL
- `thumbnail`: required
- `category_id`: required and belongs to the active competition
- `tech_stacks`: 1-8 items
- `ai_tools_used`: at least 1 item
- `gallery_urls`: max 5
- `video_url`: optional, but at least one of gallery or video required
- reject submission if the user already has 3 active entries for the competition

## Delete validation

- only owner can delete
- only while competition is active
- deletion should clean up Uploadthing assets

## Vote validation

- authenticated user required
- competition active required
- entry status must be `published`
- user cannot vote own entry

---

## Public Route Plan

## `/competition`

File: `app/competition/page.tsx`

Responsibilities:

- fetch active competition
- render landing page sections
- show CTA to submit and view entries
- when competition is closed, show ended state with finalists and winner highlights

Sections:

- hero
- about
- timeline
- hadiah
- rules
- judging criteria
- judges placeholder
- sponsor placeholder
- FAQ
- CTA banner

## `/competition/list`

Files:

- `app/competition/list/page.tsx`
- `app/competition/list/competition-list-client.tsx`

Responsibilities:

- fetch active competition + initial entry list
- sync sort with query params
- render Product Hunt-style feed

Query params:

- `sort=newest|oldest|top`

Phase 1 sort behavior:

- `newest`: `created_at desc`
- `oldest`: `created_at asc`
- `top`: `vote_count desc, created_at asc`

### Feed item requirements

- rank
- thumbnail
- title
- tagline
- maker identity
- vote count
- comment count
- created date
- category

## `/competition/submit`

File: `app/competition/submit/page.tsx`

Responsibilities:

- auth gate via redirect to `/user/auth?redirectTo=/competition/submit`
- fetch active competition and categories
- show disabled/closed state if competition is inactive
- render form + preview flow

Important UX rule:

- no edit after final submit
- therefore this page must include a preview/confirmation step before persistence

## `/competition/[slug]`

File: `app/competition/[slug]/page.tsx`

Responsibilities:

- fetch entry detail with associated competition and author data
- render vote UI
- render demo/repo CTAs
- render media section
- render comments section
- allow comment reports

Detail page sections:

- entry hero
- maker block
- media gallery
- video embed/link
- description
- process summary
- AI tools used
- tech stack
- comments

---

## Client Component Plan

## `competition-submit-form.tsx`

Responsibilities:

- manage draft state
- validate required fields before moving to preview
- upload thumbnail/gallery assets
- compose `FormData` for final action call

State shape should separate:

- raw form fields
- uploaded asset metadata (`url`, `key`)
- preview state
- submission pending state

## `competition-submit-preview.tsx`

Responsibilities:

- read-only confirmation screen
- final "submit now" action
- back button to revise before submit

## `competition-entry-card.tsx`

Responsibilities:

- render compact feed item
- link to detail page
- show vote button and vote count

## `competition-vote-button.tsx`

Responsibilities:

- optimistic update
- login prompt or redirect if unauthenticated
- disabled state when:
  - own entry
  - competition closed
  - pending request

## `competition-list-client.tsx`

Responsibilities:

- read current sort from URL
- update URL via router replacement
- fetch refreshed data through server action or route refresh pattern

Follow the same overall pattern as the current project list page, but use competition-specific fetchers.

---

## Comments Integration Plan

Instead of building a brand new comment system:

1. extend `CommentEntityType` to include `'competition'`
2. update `CreateCommentInput` and `getComments`
3. map `'competition'` to `competition_entry_id`
4. update revalidation strategy

Recommended change in `lib/actions/comments.ts`:

- replace the current binary `post` vs `project` branching with a small target mapping helper
- switch from fixed `/blog` or `/project` path revalidation to tag-driven or entry-driven invalidation

This reduces the chance of competition comments becoming a special-case fork.

---

## Admin Dashboard Plan

Create a new board under `app/(admin)/dashboard/boards/competitions`.

## Overview module

Shows:

- active competition metadata
- total entries
- total votes
- total comments
- total reports
- total finalists/winners

## Entries table

Columns:

- title
- maker
- category
- submitted_at
- vote_count
- comment_count
- status
- featured
- finalist
- winner

Actions:

- hide
- disqualify
- feature/unfeature
- lock comments
- open public detail

## Judge panel

Inputs:

- execution
- creativity
- AI usage
- UX/presentation
- completeness
- notes

Outputs:

- aggregate judge score
- public vote score
- final weighted score

## Vote audit table

Focus:

- very high-activity voters
- suspicious burst windows
- multiple votes created in short periods

Phase 1 can keep this simple with a sortable table rather than full fraud detection.

## Export

Allow CSV export with at least:

- entry metadata
- maker
- category
- vote count
- judge score
- final score
- status flags

---

## Sorting, Ranking, and Winner Computation

## Public list ranking

- `newest`: newest first
- `oldest`: oldest first
- `top`: `vote_count desc, submitted_at asc`

Tie-breaker for top ranking:

- older submission wins the tie to reward earlier validated submissions

## Winner computation

Suggested formula:

1. compute normalized judge score per entry
2. compute normalized public vote score per entry
3. `final_score = judge_score * 0.70 + public_vote_score * 0.30`
4. persist the computed result in admin read models or derive live in admin only

Do not let the public list automatically overwrite final winner flags. Final winner state should remain an admin action after review.

---

## Caching and Revalidation

Use cache tags or a central invalidation strategy. Path-only revalidation will become brittle once list/detail/admin views share data.

Invalidate after:

- entry submission
- entry deletion
- vote toggle
- comment creation/removal
- moderation state change
- judge score save
- winner/finalist flag changes

Recommended affected surfaces:

- `/competition`
- `/competition/list`
- `/competition/[slug]`
- admin competition board

---

## Testing Plan

## Unit tests

- validation helper rejects invalid URLs
- max 3 entry limit enforced
- self-vote rejection
- closed competition blocks submit/vote
- winner weighting helper computes expected score

## Integration tests

- public fetcher returns only `published` entries
- top sorting matches `vote_count desc, submitted_at asc`
- comment entity mapping works for competition entry comments

## E2E tests

1. unauthenticated user redirected from `/competition/submit`
2. authenticated user can fill form, preview, and submit
3. submitted entry appears in `/competition/list`
4. detail page shows all submitted content
5. another authenticated user can vote
6. creator cannot vote own entry
7. authenticated user can comment on detail page
8. owner can delete own entry while active
9. after close, submit and vote controls are disabled
10. admin can hide an entry and it disappears from public list

## Manual verification

- verify Uploadthing cleanup on delete
- verify sitemap contains new public routes
- verify Indonesian copy on all user-facing surfaces

---

## Implementation Sequence

## Phase 1 - schema and types

1. add competition tables and RLS
2. extend comments schema
3. seed Mini Vibeathon and categories
4. add `types/competition.ts`

## Phase 2 - public read/write layer

5. add `lib/server/competition-public.ts`
6. add `lib/actions/competition.ts`
7. extend `lib/actions/comments.ts` and `types/comments.ts`

## Phase 3 - public pages

8. build `/competition`
9. build `/competition/list`
10. build `/competition/submit`
11. build `/competition/[slug]`
12. add sitemap and translation updates

## Phase 4 - admin tooling

13. add admin board overview
14. add moderation table
15. add judge scoring panel
16. add vote audit table
17. add CSV export

## Phase 5 - testing and polish

18. unit/integration tests
19. E2E coverage
20. copy polish, empty states, ended-state UX

---

## Definition of Done

The feature is implementation-complete when:

- one active competition can be seeded and rendered at `/competition`
- authenticated users can submit up to 3 entries through preview confirmation
- submissions appear publicly in `/competition/list`
- detail pages render full entry content, voting, and comments
- self-vote is blocked
- closed competitions disable submit and vote
- admin can hide/disqualify/feature entries and score finalists
- winner and finalist flags are manageable from admin
- routes are indexed in sitemap
- public copy is available in Indonesian
- tests cover the core submission, list, vote, and comment flows

---

## Notes for the First Implementation Pass

- Keep the first release scoped to a single active competition UI even though the schema supports many competitions.
- Prefer admin-only write paths initially, because the existing dashboard gate is admin-only.
- Do not reuse the project likes system.
- Do not fork the comments UI if extending the current unified comments system is feasible.
- Use the current project list and project submit pages as UI references, not as persistence models.
