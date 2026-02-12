# Plan: Supabase Security Hardening & RLS Policy Refactor

## Status: Ready for Execution

## Problem Statement

A user reported all tables are "EXPOSED" — publicly accessible via the anon key. Screenshot confirms: posts, projects, blog_reports, events, comments, users, likes, blog_post_tags all show EXPOSED with record counts visible.

## Root Cause Analysis

**RLS IS enabled** on all 13 tables. The problem is the **policies are too permissive**:

1. Most SELECT policies use `USING (true)` — anyone with the anon key reads ALL data
2. Most policies target `{public}` role (applies to both `anon` and `authenticated`)
3. `comments` and `views` allow anonymous INSERTs (`user_id IS NULL` check)
4. `vibe_videos` lets ANY authenticated user modify ANY video
5. `views` table exposes IP addresses publicly
6. Performance issues: `auth.uid()` not wrapped in `(select ...)`, duplicate permissive SELECT policies

**Important context**: The anon key being "exposed" is **by design** in Supabase — it's a client-side key meant to be public. The security comes from RLS policies. The real fix is tightening those policies.

## Current Architecture

| File | Purpose | Key Detail |
|------|---------|------------|
| `lib/supabase/client.ts` | Browser client | Uses `anonKey` via `createBrowserClient` |
| `lib/supabase/server.ts` | Server client | Uses `anonKey` + cookies via `createServerClient` |
| `lib/supabase/admin.ts` | Admin client | Uses `serviceRoleKey` — server-only |
| `lib/supabase/middleware.ts` | Session refresh | Uses `anonKey` in middleware |
| `lib/env-config.ts` | Env validation | `getSupabaseConfig()` / `getSupabaseServerConfig()` |
| `lib/client-analytics.ts` | Client views tracking | Directly inserts to `views` via client |
| `lib/client-likes.ts` | Client like toggle | Directly inserts/deletes on `likes` via client |

---

## Phase 1: Critical Security Fixes (SQL Migrations)

**Goal**: Fix the most dangerous exposure issues immediately.
**Risk**: LOW — these are additive policy changes, not breaking.
**Rollback**: DROP the new policies, re-create old ones.

### Task 1.1: Fix `views` table — hide IP addresses from public reads

The `views` table currently exposes `ip_address` (inet type) to everyone. This is a privacy violation.

**Approach**: Replace the blanket `USING (true)` SELECT policy with one that excludes sensitive columns. Since RLS operates at row level (not column level), we need to either:
- (A) Create a VIEW that excludes `ip_address` and have the app query the view, OR
- (B) Keep the policy but ensure app code never selects `ip_address` on the client side, OR
- (C) Move view tracking entirely server-side (recommended)

**Decision**: Option C — Move view tracking to server action.

**Steps**:
1. Create server action `trackView()` in `lib/actions.ts` using server client
2. Update `lib/client-analytics.ts` to call the server action instead of direct DB insert
3. Remove the anonymous INSERT policy on `views` — only server (via admin client or authenticated server client) should insert
4. Keep SELECT policy but only for authenticated users to see their own views, plus a public aggregate count

```sql
-- Migration: 20_fix_views_security.sql

-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Views are viewable by everyone" ON public.views;

-- New: Only project/post owners can see detailed view data
CREATE POLICY "Project owners can view their project views"
ON public.views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = views.project_id AND p.author_id = (select auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = views.post_id AND p.author_id = (select auth.uid())
  )
  OR user_id = (select auth.uid())
);

-- Drop old permissive INSERT policy (anonymous insert)
DROP POLICY IF EXISTS "Secure views insertion" ON public.views;

-- New: Only authenticated users can insert views (server actions handle anonymous tracking)
CREATE POLICY "Authenticated users can insert views"
ON public.views FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- Keep admin/service role ability to insert for server-side tracking
-- (service role bypasses RLS by default)
```

**Codebase changes**:
- `lib/client-analytics.ts`: Replace direct Supabase insert with server action call
- `lib/actions.ts`: Add `trackView()` server action using admin client for anonymous visitors

### Task 1.2: Fix `vibe_videos` — restrict mutations to admins only

Currently any authenticated user can INSERT/UPDATE/DELETE any video.

```sql
-- Migration: 20_fix_views_security.sql (continued)

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated insert on vibe_videos" ON public.vibe_videos;
DROP POLICY IF EXISTS "Allow authenticated update on vibe_videos" ON public.vibe_videos;
DROP POLICY IF EXISTS "Allow authenticated delete on vibe_videos" ON public.vibe_videos;

-- New: Only admins can manage vibe_videos
CREATE POLICY "Admins can insert vibe_videos"
ON public.vibe_videos FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_moderator());

CREATE POLICY "Admins can update vibe_videos"
ON public.vibe_videos FOR UPDATE
TO authenticated
USING (is_admin_or_moderator())
WITH CHECK (is_admin_or_moderator());

CREATE POLICY "Admins can delete vibe_videos"
ON public.vibe_videos FOR DELETE
TO authenticated
USING (is_admin_or_moderator());
```

### Task 1.3: Fix `comments` anonymous INSERT

Currently allows `user_id IS NULL` — any anonymous user can insert comments.

**Decision**: Guest comments are a feature (per README). But we should rate-limit and require `author_name` for guests.

```sql
-- Migration: 20_fix_views_security.sql (continued)

-- Drop old policy
DROP POLICY IF EXISTS "Secure comment insertion" ON public.comments;

-- Authenticated users can insert their own comments
CREATE POLICY "Authenticated users can insert comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Anonymous users can insert comments only with author_name (guest comments)
CREATE POLICY "Anonymous users can insert guest comments"
ON public.comments FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND author_name IS NOT NULL
  AND length(trim(author_name)) > 0
  AND length(trim(content)) > 0
);
```

**Verification**:
- [ ] Authenticated users can still comment
- [ ] Guest comments require `author_name` (non-empty)
- [ ] Guest comments cannot set `user_id` (must be NULL)
- [ ] Empty content rejected

---

## Phase 2: RLS Policy Hardening (SQL Migrations)

**Goal**: Rewrite all policies to use specific roles and fix performance issues.
**Risk**: MEDIUM — changing SELECT policies could break reads if too restrictive.
**Rollback**: Re-apply old policies from Phase 1 backup.

### Task 2.1: Decide on public read access model

**Key question**: Should anonymous users (without login) be able to read projects, posts, users?

**Answer**: YES — this is a public showcase site. Public reads are intentional for:
- `projects` — public showcase (core feature)
- `posts` — published blog posts (SEO)
- `users` — public developer profiles
- `categories` — navigation data
- `post_tags` — navigation data
- `blog_post_tags` — navigation data
- `likes` — public like counts
- `faqs` — public info
- `vibe_videos` — public content
- `events` — approved events are public

**However**: The `USING (true)` policies on `{public}` role are fine for SELECT on these tables. The user's scanner was flagging data as "EXPOSED" because it IS intentionally public. The real issue was write permissions and sensitive data (IP addresses).

### Task 2.2: Fix RLS performance — wrap `auth.uid()` calls

Supabase advisor flagged 9 policies that re-evaluate `auth.uid()` per row instead of once per query.

```sql
-- Migration: 21_fix_rls_performance.sql

-- posts table: Fix 4 policies
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;
CREATE POLICY "Authors can view own posts"
ON public.posts FOR SELECT
TO authenticated
USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can insert own posts" ON public.posts;
CREATE POLICY "Authors can insert own posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
ON public.posts FOR UPDATE
TO authenticated
USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts"
ON public.posts FOR DELETE
TO authenticated
USING ((select auth.uid()) = author_id);

-- events table: Fix 2 policies
DROP POLICY IF EXISTS "Authenticated users can submit events" ON public.events;
CREATE POLICY "Authenticated users can submit events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = submitted_by);

DROP POLICY IF EXISTS "Users can view their own pending events" ON public.events;
CREATE POLICY "Users can view their own pending events"
ON public.events FOR SELECT
TO authenticated
USING ((select auth.uid()) = submitted_by);

-- faqs table: Fix 3 policies (also switch from subquery to helper function)
DROP POLICY IF EXISTS "Admins can insert faqs" ON public.faqs;
CREATE POLICY "Admins can insert faqs"
ON public.faqs FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can update faqs" ON public.faqs;
CREATE POLICY "Admins can update faqs"
ON public.faqs FOR UPDATE
TO authenticated
USING (is_admin_or_moderator())
WITH CHECK (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can delete faqs" ON public.faqs;
CREATE POLICY "Admins can delete faqs"
ON public.faqs FOR DELETE
TO authenticated
USING (is_admin_or_moderator());
```

### Task 2.3: Consolidate duplicate SELECT policies on `posts`

Supabase advisor flagged `multiple_permissive_policies` — both "Authors can view own posts" and "Public posts are viewable by everyone" apply to same roles.

```sql
-- Migration: 21_fix_rls_performance.sql (continued)

-- Consolidate into single SELECT policy
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;

-- Single combined policy: Published posts visible to all, drafts to author only
CREATE POLICY "Posts visibility"
ON public.posts FOR SELECT
USING (
  status = 'published'
  OR (select auth.uid()) = author_id
);
```

### Task 2.4: Tighten role scoping on write policies

Change policies from `{public}` to specific roles where appropriate.

```sql
-- Migration: 21_fix_rls_performance.sql (continued)

-- projects: Write policies should require authentication
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
ON public.projects FOR UPDATE
TO authenticated
USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects"
ON public.projects FOR DELETE
TO authenticated
USING ((select auth.uid()) = author_id);

-- users: Write policies should require authentication
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id);

-- likes: Write policies should require authentication
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
CREATE POLICY "Users can insert own likes"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
CREATE POLICY "Users can delete own likes"
ON public.likes FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- comments: Update/Delete should require authentication
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- blog_post_tags: Write policies should require authentication
DROP POLICY IF EXISTS "Authors can insert blog post tags" ON public.blog_post_tags;
CREATE POLICY "Authors can insert blog post tags"
ON public.blog_post_tags FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_moderator() OR EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = blog_post_tags.post_id AND p.author_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Authors can delete blog post tags" ON public.blog_post_tags;
CREATE POLICY "Authors can delete blog post tags"
ON public.blog_post_tags FOR DELETE
TO authenticated
USING (
  is_admin_or_moderator() OR EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = blog_post_tags.post_id AND p.author_id = (select auth.uid())
  )
);

-- post_tags: Write policies should require authentication
DROP POLICY IF EXISTS "Admins can insert post tags" ON public.post_tags;
CREATE POLICY "Admins can insert post tags"
ON public.post_tags FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can update post tags" ON public.post_tags;
CREATE POLICY "Admins can update post tags"
ON public.post_tags FOR UPDATE
TO authenticated
USING (is_admin_or_moderator())
WITH CHECK (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can delete post tags" ON public.post_tags;
CREATE POLICY "Admins can delete post tags"
ON public.post_tags FOR DELETE
TO authenticated
USING (is_admin_or_moderator());

-- blog_reports: Write policies should require authentication
DROP POLICY IF EXISTS "Users can create blog reports" ON public.blog_reports;
CREATE POLICY "Users can create blog reports"
ON public.blog_reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view blog reports" ON public.blog_reports;
CREATE POLICY "Admins can view blog reports"
ON public.blog_reports FOR SELECT
TO authenticated
USING (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can update blog reports" ON public.blog_reports;
CREATE POLICY "Admins can update blog reports"
ON public.blog_reports FOR UPDATE
TO authenticated
USING (is_admin_or_moderator())
WITH CHECK (is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can delete blog reports" ON public.blog_reports;
CREATE POLICY "Admins can delete blog reports"
ON public.blog_reports FOR DELETE
TO authenticated
USING (is_admin_or_moderator());

-- views: Update/Delete should require authentication
DROP POLICY IF EXISTS "Users can update own views" ON public.views;
CREATE POLICY "Users can update own views"
ON public.views FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own views" ON public.views;
CREATE POLICY "Users can delete own views"
ON public.views FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);
```

---

## Phase 3: Client-Side Architecture Refactor (Code Changes)

**Goal**: Move sensitive operations server-side, keep client ops for UX where safe.
**Risk**: MEDIUM — changes user-facing behavior.
**Rollback**: Git revert.

### Task 3.1: Move view tracking to server action

**Files to modify**:
- `lib/actions.ts` — Add `trackView()` server action
- `lib/client-analytics.ts` — Replace direct DB insert with server action call
- Remove IP address collection from client-side (was never appropriate)

**Implementation**:

```typescript
// lib/actions.ts — ADD:
export async function trackView(input: {
  projectId?: number
  postId?: string
  sessionId: string
}) {
  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    session_id: input.sessionId,
    view_date: new Date().toISOString().split('T')[0],
  }

  if (input.projectId) insertData.project_id = input.projectId
  if (input.postId) insertData.post_id = input.postId

  // Check auth status — if logged in, attach user_id
  const { data: { user } } = await supabase.auth.getUser()
  if (user) insertData.user_id = user.id

  const { error } = await supabase.from('views').insert(insertData)
  if (error) {
    console.error('Track view error:', error)
  }
}
```

```typescript
// lib/client-analytics.ts — REPLACE direct insert:
'use client'
import { trackView } from '@/lib/actions'

export async function trackProjectView(projectId: number, sessionId: string) {
  try {
    await trackView({ projectId, sessionId })
  } catch {
    // Fail silently
  }
}
```

### Task 3.2: Verify client-side likes still work with tightened RLS

After Phase 2 changes, `lib/client-likes.ts` uses the browser client (anon key). The new policies require `authenticated` role for INSERT/DELETE on likes.

**Check**: The browser client uses cookies for auth — if user is logged in, requests go as `authenticated` role. This should still work since likes require login in the UI anyway.

**Test**: 
- [ ] Logged-in user can like a project
- [ ] Logged-in user can unlike a project
- [ ] Anonymous user cannot like (UI already prevents this)

### Task 3.3: Fix events SELECT policy consolidation

```sql
-- In migration 21: Consolidate events SELECT policies
-- Currently: "Public events are viewable by everyone" (approved=true) 
--   + "Users can view their own pending events" (auth.uid()=submitted_by)
-- Problem: Multiple permissive policies for authenticated role on SELECT

-- Already handled by keeping both policies but fixing performance.
-- The two policies serve different purposes and OR semantics is correct here.
-- Just ensure the auth.uid() is wrapped (done in Task 2.2).
```

---

## Phase 4: Cleanup & Hardening

**Goal**: Address remaining Supabase advisor warnings and documentation.
**Risk**: LOW.

### Task 4.1: Enable Leaked Password Protection

Via Supabase Dashboard: Authentication > Settings > Enable "Leaked Password Protection"

No code changes needed.

### Task 4.2: Clean up unused indexes

```sql
-- Migration: 22_cleanup_unused_indexes.sql
-- Only drop indexes confirmed unused by Supabase advisor
-- NOTE: Run AFTER Phase 2 policies are applied and tested

DROP INDEX IF EXISTS idx_likes_project_user;
DROP INDEX IF EXISTS idx_comments_project_created;
DROP INDEX IF EXISTS idx_views_user_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_projects_category;
DROP INDEX IF EXISTS idx_comments_project_id;
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS idx_projects_tags;
DROP INDEX IF EXISTS idx_posts_published_at;
DROP INDEX IF EXISTS idx_comments_post_id;
DROP INDEX IF EXISTS idx_events_pending_created;
DROP INDEX IF EXISTS idx_events_submitted_by;
DROP INDEX IF EXISTS idx_events_approved_category_date;
DROP INDEX IF EXISTS idx_events_approved_date;
DROP INDEX IF EXISTS idx_blog_reports_status;
DROP INDEX IF EXISTS idx_blog_post_tags_tag_id;
DROP INDEX IF EXISTS idx_blog_reports_reporter_id;
DROP INDEX IF EXISTS events_location_type_idx;
DROP INDEX IF EXISTS events_date_idx;
DROP INDEX IF EXISTS idx_views_user_date;
```

### Task 4.3: Update documentation

- Update `docs/security/RLS_POLICIES.md` with new policy definitions
- Update `docs/security/SECURITY_AUDIT_SUMMARY.md` with this refactor
- Update `WARP.md` if applicable

### Task 4.4: Verify `is_admin_or_moderator()` function security

```sql
-- Check function definition
SELECT prosrc, proconfig FROM pg_proc
WHERE proname = 'is_admin_or_moderator';
```

Ensure it uses `(select auth.uid())` internally and has `SET search_path = public, pg_temp`.

---

## Execution Order

```
Phase 1 (Critical) ← DO FIRST, can be done independently
  Task 1.1: Fix views table (migration + code)
  Task 1.2: Fix vibe_videos policies (migration)
  Task 1.3: Fix comments anonymous INSERT (migration)
  
Phase 2 (Hardening) ← Depends on Phase 1
  Task 2.1: Confirm public read model (decision only)
  Task 2.2: Fix auth.uid() performance (migration)
  Task 2.3: Consolidate posts SELECT (migration)
  Task 2.4: Tighten role scoping (migration)

Phase 3 (Code Refactor) ← Depends on Phase 1
  Task 3.1: Move view tracking server-side (code)
  Task 3.2: Verify client likes (test)
  Task 3.3: Events SELECT consolidation (migration)

Phase 4 (Cleanup) ← Independent
  Task 4.1: Enable leaked password protection (dashboard)
  Task 4.2: Clean unused indexes (migration)
  Task 4.3: Update documentation
  Task 4.4: Verify admin function security
```

## Testing Strategy

### Per-Migration Testing
After each SQL migration:
1. Run `bun dev` — verify app still loads
2. Test as anonymous user — can browse projects, posts, profiles
3. Test as authenticated user — can like, comment, submit project
4. Test as admin — can manage vibe_videos, faqs, blog reports

### Regression Checklist
- [ ] Homepage loads (projects showcase)
- [ ] Project listing page works (filtering, search)
- [ ] Project detail page works (views tracked)
- [ ] Blog listing works
- [ ] Blog post detail works (views tracked)
- [ ] User can register/login
- [ ] User can submit project
- [ ] User can like/unlike project
- [ ] User can comment on project
- [ ] Guest can comment on blog post (with name)
- [ ] User can edit own profile
- [ ] Admin can manage vibe_videos
- [ ] Admin can manage FAQs
- [ ] Admin can manage blog reports
- [ ] Calendar/events page loads
- [ ] View counts still increment

## Rollback Strategy

Each phase can be rolled back independently:

1. **Phase 1**: Re-create old policies (stored in `pg_policies` backup query above)
2. **Phase 2**: Re-create old policies (same approach)
3. **Phase 3**: `git revert` the code changes
4. **Phase 4**: No rollback needed (documentation, dashboard settings)

Always take a database backup before running migrations:
```sql
-- Query to backup current policies before changes
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Files Affected

**SQL Migrations (new)**:
- `scripts/20_fix_critical_security.sql`
- `scripts/21_fix_rls_performance.sql`
- `scripts/22_cleanup_unused_indexes.sql`

**Code Changes**:
- `lib/actions.ts` — Add `trackView()` server action
- `lib/client-analytics.ts` — Replace direct DB with server action
- `docs/security/RLS_POLICIES.md` — Update documentation
- `docs/security/SECURITY_AUDIT_SUMMARY.md` — Update documentation

## NOT In Scope

- **Rotating the anon key**: Not needed — anon key is designed to be public. RLS is the security mechanism.
- **Switching to publishable keys**: Supabase publishable keys are a newer feature that doesn't change the security model — RLS still does the heavy lifting. Can evaluate later.
- **Database version upgrade**: Flagged by advisor but is an infrastructure change, not a code change.
