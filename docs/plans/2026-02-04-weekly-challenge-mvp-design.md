# Weekly Challenge MVP Design

Date: 2026-02-04
Status: Approved

## Goal
Ship a weekly challenge hub with a hosted prompt, authenticated submissions, community voting, and a leaderboard. Keep MVP small, fast to build, and aligned with existing Supabase auth and project conventions.

## Non-goals
- Multi-phase hackathons, team formation, or judge workflows
- File uploads or asset hosting for submissions
- Advanced moderation UI or anti-cheat systems

## Scope (MVP)
- Weekly challenge detail page with prompt, rules, CTA, and leaderboard
- Authenticated user submissions (project URL + short write-up)
- Community votes/likes for ranking
- Closed state when the challenge ends

## Data Model
### challenges
Fields:
- id (uuid, pk)
- slug (text, unique)
- title (text)
- prompt (text)
- starts_at (timestamptz)
- ends_at (timestamptz)
- prize_text (text)
- status (text: draft|active|closed|archived)
- created_by (uuid, fk to auth.users)
- created_at, updated_at

Constraints:
- check (starts_at < ends_at)
- optional: use enum types for status values

Indexes:
- unique index on slug
- index on status, starts_at, ends_at

### challenge_submissions
Fields:
- id (uuid, pk)
- challenge_id (uuid, fk to challenges)
- user_id (uuid, fk to auth.users)
- title (text)
- project_url (text)
- writeup (text)
- status (text: visible|hidden)
- created_at, updated_at

Constraints:
- unique (challenge_id, user_id)
- check (project_url ~ '^https://')
- check (char_length(writeup) between 100 and 1200)
- optional: use enum types for status values

Indexes:
- index on challenge_id
- index on user_id

### challenge_votes
Fields:
- id (uuid, pk)
- submission_id (uuid, fk to challenge_submissions)
- user_id (uuid, fk to auth.users)
- created_at

Constraints:
- unique (submission_id, user_id)

Indexes:
- index on submission_id
- index on user_id
- index on challenge_submissions.user_id (RLS)
- index on challenge_votes.user_id (RLS)
- partial index on challenge_submissions(challenge_id, created_at) where status = 'visible'

## RLS Policies (High-level)
- challenges: public read; admin-only write (via server action or SQL)
- challenge_submissions:
  - public read for visible submissions
  - insert/update only by owner
  - insert/update only while challenge is active
- challenge_votes:
  - public read
  - insert/delete only by owner
  - insert/delete only while challenge is active

## RLS Policies (Detailed)
- challenges: select for all; insert/update/delete restricted to admin role
- challenge_submissions:
  - select: status = 'visible' OR user_id = auth.uid()
  - insert: user_id = auth.uid() AND challenge is active
  - update: user_id = auth.uid() AND challenge is active
- challenge_votes:
  - select: all
  - insert/delete: user_id = auth.uid() AND challenge is active

## Routes
- app/challenges/page.tsx
  - list active + recent challenges
- app/challenges/[slug]/page.tsx
  - prompt, rules, CTA, submissions, leaderboard
- app/challenges/[slug]/submit/page.tsx
  - submission form (auth-only)

## Server Actions
- getActiveChallenges()
- getChallengeBySlug(slug)
- getChallengeLeaderboard(challengeId)
- submitChallengeEntry(challengeId, data)
- toggleChallengeVote(submissionId)

Rules enforced in actions:
- only authenticated users
- challenge must be active
- validate URL (https), writeup length, and one submission per user

## Leaderboard
- Ranking: vote_count desc, created_at asc
- Query: aggregate count of votes per submission
- Optional cache tag for invalidation on vote (not required for MVP)

## Submission Rules
- project_url must be https
- writeup 100-1200 chars
- title required
- one submission per user per challenge

## Voting Rules
- one vote per user per submission
- voting enabled only while challenge is active

## Active State Definition
- Canonical: starts_at <= now() < ends_at
- status is for admin control; action checks must enforce both time window and status = 'active'

## UI/UX
- Challenge list cards show title, short prompt, end date, prize text
- Challenge detail shows:
  - prompt and rules
  - countdown or end date
  - CTA submit button (disabled if closed)
  - leaderboard with vote button
- Submission form:
  - title, project_url, writeup, rules checkbox
  - client + server validation
  - success toast and redirect to detail
- Empty state for no submissions

## Moderation (MVP)
- status flag for submissions (visible|hidden)
- admin toggles status via server action or direct SQL (no UI yet)

## Testing (Playwright)
1) Login, open challenge, submit entry, verify appears in leaderboard
2) Vote on submission, verify count increments, toggle to remove
3) Closed challenge disables submit and voting

## React/Next.js Performance Notes
- Use server components for list/detail pages and fetch data in parallel via Promise.all
- Keep vote button as client component; update count optimistically to avoid full re-fetch
- Consider Suspense boundary for leaderboard to avoid blocking the prompt section

## Rollout Notes
- Seed one active challenge via SQL or admin action
- Announce in homepage CTA once live
