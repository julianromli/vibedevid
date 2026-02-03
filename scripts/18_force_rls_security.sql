-- ============================================================================
-- Migration: 18 - Force Row Level Security
-- Purpose: Enable FORCE ROW LEVEL SECURITY on all tables to prevent bypass
-- 
-- CRITICAL SECURITY FIX:
-- Without FORCE RLS, table owners (postgres role) can bypass RLS policies.
-- This migration enforces RLS for ALL users, including superusers.
-- 
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Security Impact: Prevents privilege escalation attacks
-- ============================================================================

-- ============================================================================
-- CRITICAL TABLES (User Data)
-- ============================================================================

-- Users table: Contains personal information
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Projects table: User-generated content
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

-- Comments table: User comments on projects and blog posts
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;

-- Likes table: User engagement data
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;

-- Views table: Analytics and session data
ALTER TABLE public.views FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- BLOG TABLES
-- ============================================================================

-- Blog posts table
ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;

-- Blog post tags relationship
ALTER TABLE public.blog_post_tags FORCE ROW LEVEL SECURITY;

-- Blog reports for moderation
ALTER TABLE public.blog_reports FORCE ROW LEVEL SECURITY;

-- Post tags table
ALTER TABLE public.post_tags FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- METADATA TABLES
-- ============================================================================

-- Categories for projects
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;

-- Vibe videos showcase
ALTER TABLE public.vibe_videos FORCE ROW LEVEL SECURITY;

-- Community events
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;

-- FAQ entries
ALTER TABLE public.faqs FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERY
-- Run this to confirm FORCE RLS is enabled on all tables
-- ============================================================================

-- Uncomment to verify:
-- SELECT 
--   tablename,
--   (SELECT relrowsecurity 
--    FROM pg_class c 
--    WHERE c.oid = ('public.' || tablename)::regclass) AS rls_enabled,
--   (SELECT relforcerowsecurity 
--    FROM pg_class c 
--    WHERE c.oid = ('public.' || tablename)::regclass) AS force_rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- Expected result: All tables should have force_rls_enabled = true

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To disable FORCE RLS (NOT RECOMMENDED):
-- ALTER TABLE public.users NO FORCE ROW LEVEL SECURITY;
-- (Repeat for all tables)
