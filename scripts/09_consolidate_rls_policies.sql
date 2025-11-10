-- Migration: Consolidate redundant RLS policies
-- Removes duplicate permissive policies to reduce query overhead
-- Date: 2025-11-10
-- Fixes: 16 multiple_permissive_policies warnings from Supabase advisors

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

-- Issue: Both "Admin can manage" and "viewable by everyone" allow SELECT for public
-- Solution: Restrict admin policy to non-public operations only
-- Note: Admin functionality will be properly implemented when admin roles are added

DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
-- Temporarily disable admin policy (will be re-enabled with proper role checks)
-- CREATE POLICY "Admin can manage categories" ON categories
--   FOR ALL USING (false); -- Placeholder until admin roles implemented

-- Keep existing: "Categories are viewable by everyone" (correct as-is)

-- ============================================================================
-- LIKES TABLE
-- ============================================================================

-- Issue: "Likes are viewable by everyone" + "Users can manage" both allow SELECT
-- Solution: Split "manage" policy into specific INSERT/DELETE permissions only

DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

CREATE POLICY "Users can insert own likes" ON likes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Keep existing: "Likes are viewable by everyone" handles SELECT

-- ============================================================================
-- VIEWS TABLE
-- ============================================================================

-- Issue: Multiple overlapping policies for INSERT and SELECT
-- Solution: Split "manage" policy into specific UPDATE/DELETE permissions only

DROP POLICY IF EXISTS "Users can manage own views" ON views;

-- Keep "Secure views insertion" for INSERT (handles guest + authenticated)
-- Keep "Views are viewable by everyone" for SELECT

-- Add specific policies for UPDATE/DELETE operations
CREATE POLICY "Users can update own views" ON views
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own views" ON views
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Add documentation
COMMENT ON POLICY "Users can insert own likes" ON likes IS 'Separated from "manage" policy to reduce permissive policy overhead';
COMMENT ON POLICY "Users can delete own likes" ON likes IS 'Separated from "manage" policy to reduce permissive policy overhead';
COMMENT ON POLICY "Users can update own views" ON views IS 'Separated from "manage" policy to reduce permissive policy overhead';
COMMENT ON POLICY "Users can delete own views" ON views IS 'Separated from "manage" policy to reduce permissive policy overhead';
