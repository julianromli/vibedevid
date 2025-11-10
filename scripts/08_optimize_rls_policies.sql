-- Migration: Optimize RLS policies to prevent InitPlan re-evaluation
-- Wraps auth.uid() and auth.role() in SELECT subqueries for better performance
-- Date: 2025-11-10
-- Fixes: 15 auth_rls_initplan warnings from Supabase advisors

-- ============================================================================
-- USERS TABLE (2 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- PROJECTS TABLE (3 policies)
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
-- COMMENTS TABLE (3 policies)
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
-- LIKES TABLE (1 policy)
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
CREATE POLICY "Users can manage their own likes" ON likes
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- VIEWS TABLE (2 policies)
-- ============================================================================

DROP POLICY IF EXISTS "Secure views insertion" ON views;
CREATE POLICY "Secure views insertion" ON views
  FOR INSERT WITH CHECK ((user_id IS NULL) OR ((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can manage own views" ON views;
CREATE POLICY "Users can manage own views" ON views
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- VIBE_VIDEOS TABLE (3 policies)
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

-- Add comments for documentation
COMMENT ON POLICY "Users can update own profile" ON users IS 'Optimized RLS: auth.uid() wrapped in SELECT to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can insert own profile" ON users IS 'Optimized RLS: auth.uid() wrapped in SELECT to prevent per-row re-evaluation';
