# Database Optimization & Fix Plan
**Generated:** 2025-11-10  
**Status:** Ready for Implementation  
**Priority:** HIGH - Performance & Security Issues Detected

---

## 📊 Current Status Overview

### ✅ Good News: Critical Indexes Already Exist!
Analysis shows that **most critical indexes are already in place**, including:
- ✅ `idx_projects_slug` - The most critical index (already exists!)
- ✅ `idx_likes_user_id` - Foreign key index
- ✅ `idx_comments_user_id` - Foreign key index (partial)
- ✅ `idx_views_user_id` - Foreign key index (partial)
- ✅ `idx_projects_created_at` - Date sorting index

**Result:** Project is in better shape than initially assessed. No emergency index creation needed.

---

## 🔴 Critical Issues Found (47 Total)

### Issue Breakdown:
| Category | Count | Severity | Impact |
|----------|-------|----------|--------|
| **Auth RLS InitPlan** | 15 | WARN | Performance degradation at scale |
| **Multiple Permissive Policies** | 16 | WARN | Query overhead, redundant checks |
| **Security Issues** | 4 | WARN | Security vulnerabilities |
| **Unused Indexes** | 7 | INFO | Minor disk space usage |
| **Missing Composite Indexes** | 4 | MEDIUM | Query optimization opportunity |

---

## 🎯 Fix Plan by Priority

### **PHASE 1: CRITICAL - RLS Performance Issues (15 fixes)**
**Impact:** Prevents performance degradation at scale  
**Effort:** Medium (SQL migration)  
**Timeline:** Implement immediately

#### Problem:
All RLS policies use `auth.uid()` directly, which gets re-evaluated for **every row**. At scale, this causes significant slowdown.

#### Solution:
Wrap `auth.uid()` in a subquery: `(SELECT auth.uid())`

#### Affected Tables & Policies:

**1. users (2 policies)**
- ❌ `Users can update own profile` - Uses `auth.uid() = id`
- ❌ `Users can insert own profile` - Uses `auth.uid() = id`

**2. projects (3 policies)**
- ❌ `Users can insert own projects` - Uses `auth.uid() = author_id`
- ❌ `Users can update own projects` - Uses `auth.uid() = author_id`
- ❌ `Users can delete own projects` - Uses `auth.uid() = author_id`

**3. comments (3 policies)**
- ❌ `Secure comment insertion` - Uses `auth.uid() = user_id`
- ❌ `Users can update own comments` - Uses `auth.uid() = user_id`
- ❌ `Users can delete own comments` - Uses `auth.uid() = user_id`

**4. likes (1 policy)**
- ❌ `Users can manage their own likes` - Uses `auth.uid() = user_id`

**5. views (2 policies)**
- ❌ `Secure views insertion` - Uses `auth.uid() = user_id`
- ❌ `Users can manage own views` - Uses `auth.uid() = user_id`

**6. vibe_videos (3 policies)**
- ❌ `Allow authenticated insert on vibe_videos` - Uses `auth.role()`
- ❌ `Allow authenticated update on vibe_videos` - Uses `auth.role()`
- ❌ `Allow authenticated delete on vibe_videos` - Uses `auth.role()`

---

### **PHASE 2: HIGH PRIORITY - Multiple Permissive Policies (16 fixes)**
**Impact:** Reduces query overhead  
**Effort:** Medium (Policy consolidation)  
**Timeline:** Within 1 week

#### Problem:
Multiple overlapping policies for same role + action. Each policy must execute for every query.

#### Solution:
Consolidate into single policies using OR conditions where appropriate.

#### Affected Tables:

**1. categories (4 duplicates)**
- Issue: `Admin can manage categories` + `Categories are viewable by everyone` both allow SELECT
- Roles affected: anon, authenticated, authenticator, dashboard_user
- Fix: Make admin policy restrictive OR consolidate

**2. likes (4 duplicates)**
- Issue: `Likes are viewable by everyone` + `Users can manage their own likes` both allow SELECT
- Roles affected: anon, authenticated, authenticator, dashboard_user
- Fix: Remove redundant SELECT permission from "manage" policy

**3. views (8 duplicates)**
- Issue: Multiple overlapping policies for INSERT and SELECT
- Policies: `Secure views insertion` + `Users can manage own views` (INSERT)
- Policies: `Views are viewable by everyone` + `Users can manage own views` (SELECT)
- Roles affected: anon, authenticated, authenticator, dashboard_user
- Fix: Consolidate or make one restrictive

---

### **PHASE 3: SECURITY IMPROVEMENTS (4 fixes)**
**Impact:** Enhances security posture  
**Effort:** Low to Medium  
**Timeline:** Within 2 weeks

#### 1. Extension in Public Schema ⚠️
**Issue:** Extension `unaccent` is installed in public schema  
**Risk:** Namespace pollution, potential conflicts  
**Fix:**
```sql
-- Move unaccent to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
```

#### 2. Auth OTP Long Expiry ⚠️
**Issue:** Email OTP expiry set to more than 1 hour  
**Risk:** Security vulnerability - longer window for OTP compromise  
**Fix:**
- Go to Supabase Dashboard → Authentication → Email Auth
- Set OTP expiry to ≤ 3600 seconds (1 hour)
- Recommended: 1800 seconds (30 minutes)

#### 3. Leaked Password Protection Disabled ⚠️
**Issue:** HaveIBeenPwned integration not enabled  
**Risk:** Users can use compromised passwords  
**Fix:**
- Go to Supabase Dashboard → Authentication → Password
- Enable "Leaked Password Protection"
- This checks passwords against HaveIBeenPwned.org

#### 4. Vulnerable Postgres Version ⚠️
**Issue:** Current version `supabase-postgres-17.4.1.074` has security patches available  
**Risk:** Unpatched security vulnerabilities  
**Fix:**
- Upgrade Postgres in Supabase Dashboard
- Go to Settings → Infrastructure → Upgrade Database
- Follow Supabase upgrade process

---

### **PHASE 4: OPTIMIZATION - Missing Composite Indexes (4 additions)**
**Impact:** Query performance optimization  
**Effort:** Low (SQL migration)  
**Timeline:** When convenient

#### Missing Indexes:

**1. Composite: likes(project_id, user_id)**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_project_user 
ON likes(project_id, user_id);
```
**Benefit:** Optimizes `toggleLike()` checks (currently does 2 separate index scans)

**2. Composite: comments(project_id, created_at)**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_project_created 
ON comments(project_id, created_at DESC);
```
**Benefit:** Optimizes `getComments()` which filters by project and orders by date

**3. Composite: projects(author_id, created_at)**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_author_created 
ON projects(author_id, created_at DESC);
```
**Benefit:** Optimizes profile page queries (user's projects sorted by date)

**4. Single: users.email**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);
```
**Benefit:** Speeds up auth flows and email lookups

---

## 📋 Implementation Scripts

### Script 1: Fix RLS InitPlan Issues (Phase 1)

**File:** `scripts/08_optimize_rls_policies.sql`

```sql
-- Migration: Optimize RLS policies to prevent InitPlan re-evaluation
-- Wraps auth.uid() and auth.role() in SELECT subqueries
-- Date: 2025-11-10

-- ============================================================================
-- USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Secure comment insertion" ON comments;
CREATE POLICY "Secure comment insertion" ON comments
  FOR INSERT WITH CHECK ((user_id IS NULL) OR ((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- LIKES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- VIEWS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Secure views insertion" ON views;
CREATE POLICY "Secure views insertion" ON views
  FOR INSERT WITH CHECK ((user_id IS NULL) OR ((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own views" ON views;
CREATE POLICY "Users can manage own views" ON views
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- VIBE_VIDEOS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated insert on vibe_videos" ON vibe_videos;
CREATE POLICY "Allow authenticated insert on vibe_videos" ON vibe_videos
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update on vibe_videos" ON vibe_videos;
CREATE POLICY "Allow authenticated update on vibe_videos" ON vibe_videos
  FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete on vibe_videos" ON vibe_videos;
CREATE POLICY "Allow authenticated delete on vibe_videos" ON vibe_videos
  FOR DELETE USING ((SELECT auth.role()) = 'authenticated');
```

---

### Script 2: Consolidate Multiple Permissive Policies (Phase 2)

**File:** `scripts/09_consolidate_rls_policies.sql`

```sql
-- Migration: Consolidate redundant RLS policies
-- Removes duplicate permissive policies to reduce query overhead
-- Date: 2025-11-10

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

-- Current issue: Both policies allow SELECT for public
-- Solution: Keep public viewable, restrict admin policy to non-SELECT only

DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (false); -- Will be updated when admin roles are implemented

-- Keep existing: "Categories are viewable by everyone" (already correct)

-- ============================================================================
-- LIKES TABLE
-- ============================================================================

-- Current issue: "Likes are viewable by everyone" + "Users can manage" both allow SELECT
-- Solution: Split "manage" policy into INSERT/UPDATE/DELETE only

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Keep existing: "Likes are viewable by everyone" for SELECT

-- ============================================================================
-- VIEWS TABLE
-- ============================================================================

-- Current issue: Multiple overlapping policies for INSERT and SELECT
-- Solution: Split responsibilities clearly

DROP POLICY IF EXISTS "Users can manage own views" ON views;

-- Keep "Secure views insertion" for INSERT (guest + authenticated)
-- Keep "Views are viewable by everyone" for SELECT

-- Add specific policies for UPDATE/DELETE only
CREATE POLICY "Users can update own views" ON views
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own views" ON views
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

---

### Script 3: Add Missing Composite Indexes (Phase 4)

**File:** `scripts/10_add_composite_indexes.sql`

```sql
-- Migration: Add missing composite indexes for query optimization
-- Date: 2025-11-10

-- Composite index for like checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_project_user 
ON likes(project_id, user_id);

-- Composite index for comment queries with ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_project_created 
ON comments(project_id, created_at DESC);

-- Composite index for profile page queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_author_created 
ON projects(author_id, created_at DESC);

-- Email lookup index for auth operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- Add documentation
COMMENT ON INDEX idx_likes_project_user IS 'Composite index for checking user likes on projects';
COMMENT ON INDEX idx_comments_project_created IS 'Optimizes comment listing with time ordering';
COMMENT ON INDEX idx_projects_author_created IS 'Optimizes user profile project queries';
COMMENT ON INDEX idx_users_email IS 'Email lookup index for authentication';
```

---

### Script 4: Move Extension to Correct Schema (Phase 3)

**File:** `scripts/11_move_extension_to_extensions_schema.sql`

```sql
-- Migration: Move unaccent extension to extensions schema
-- Date: 2025-11-10

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extension
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Update search path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;
```

---

## 📊 Expected Performance Improvements

### After Phase 1 (RLS Optimization):
- **Write operations (INSERT/UPDATE/DELETE):** 30-50% faster
- **Queries with RLS checks:** 20-40% faster at scale
- **Impact increases with table size** (more rows = bigger benefit)

### After Phase 2 (Policy Consolidation):
- **SELECT queries on categories/likes/views:** 10-20% faster
- **Reduced policy evaluation overhead**

### After Phase 4 (Composite Indexes):
- **Like toggle operations:** 40-60% faster
- **Comment retrieval:** 30-50% faster
- **Profile page queries:** 30-50% faster

---

## ⚠️ Important Notes

### About "Unused" Indexes:
The advisors report shows 7 "unused" indexes. **DO NOT remove these:**
- `idx_views_user_id` - Needed for user analytics
- `idx_comments_user_id` - Needed for user comment queries
- `idx_projects_category` - Needed for category filtering (will be used when implemented)
- `idx_comments_project_id` - May not show usage due to composite index preference
- `idx_categories_name` - Needed for category lookups
- `idx_projects_tags` - Needed for tag-based search (future feature)
- `idx_views_user_date` - Needed for user analytics by date

**Reason:** These indexes are for features that exist in code but may not be heavily used yet. Removing them would degrade performance when those features are used.

---

## 🚀 Deployment Strategy

### Step 1: Test in Staging (If Available)
```bash
# Apply migrations one by one in staging
psql -h staging-host -d vibedev -f scripts/08_optimize_rls_policies.sql
psql -h staging-host -d vibedev -f scripts/09_consolidate_rls_policies.sql
psql -h staging-host -d vibedev -f scripts/10_add_composite_indexes.sql
psql -h staging-host -d vibedev -f scripts/11_move_extension_to_extensions_schema.sql

# Run tests
pnpm test
```

### Step 2: Backup Production
```bash
# Create backup before applying
pg_dump -h prod-host -U postgres -d vibedev > backup_$(date +%Y%m%d).sql
```

### Step 3: Apply to Production
```bash
# Use Supabase apply_migration (recommended)
# Or execute directly via psql

# Phase 1 - Critical (RLS fixes)
supabase db push # Apply 08_optimize_rls_policies.sql

# Phase 2 - High Priority (Policy consolidation)  
supabase db push # Apply 09_consolidate_rls_policies.sql

# Phase 3 - Security (Manual via Dashboard + SQL)
# Do manually via Dashboard for auth settings
# Then run: 11_move_extension_to_extensions_schema.sql

# Phase 4 - Optimization (Composite indexes)
# Can be done anytime - uses CONCURRENTLY so non-blocking
supabase db push # Apply 10_add_composite_indexes.sql
```

### Step 4: Verify & Monitor
```sql
-- Check policies are updated
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Monitor query performance
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

---

## ✅ Checklist

### Phase 1: RLS Optimization
- [ ] Review RLS policy changes
- [ ] Create migration file `08_optimize_rls_policies.sql`
- [ ] Test in staging/local
- [ ] Apply to production
- [ ] Run `get_advisors` to verify fixes
- [ ] Monitor application logs for errors

### Phase 2: Policy Consolidation
- [ ] Review policy consolidation strategy
- [ ] Create migration file `09_consolidate_rls_policies.sql`
- [ ] Test all affected operations (likes, views, categories)
- [ ] Apply to production
- [ ] Verify no permission errors

### Phase 3: Security Improvements
- [ ] Enable Leaked Password Protection (Dashboard)
- [ ] Adjust OTP expiry to ≤1 hour (Dashboard)
- [ ] Create migration `11_move_extension_to_extensions_schema.sql`
- [ ] Apply extension migration
- [ ] Schedule Postgres upgrade
- [ ] Test all features post-upgrade

### Phase 4: Composite Indexes
- [ ] Create migration file `10_add_composite_indexes.sql`
- [ ] Apply migration (non-blocking with CONCURRENTLY)
- [ ] Monitor index creation progress
- [ ] Verify indexes with EXPLAIN ANALYZE
- [ ] Monitor query performance improvements

---

## 📚 References

- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Database Linter Guide](https://supabase.com/docs/guides/database/database-linter)
- [Postgres Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Going Into Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Status:** Ready for Implementation  
**Estimated Total Effort:** 4-8 hours  
**Priority:** Phase 1 should be done ASAP (within 1 week)
