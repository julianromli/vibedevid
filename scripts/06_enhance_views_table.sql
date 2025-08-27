-- Migration: Enhance views table for unique visitor tracking
-- This adds session-based analytics capabilities

-- Add session_id column to views table
ALTER TABLE public.views ADD COLUMN session_id TEXT;

-- Add date columns for time-based analytics
ALTER TABLE public.views ADD COLUMN view_date DATE DEFAULT CURRENT_DATE;

-- Create unique constraint to prevent duplicate views per session
-- This ensures one view per session per project
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_views_project_session 
ON public.views(project_id, session_id) 
WHERE session_id IS NOT NULL;

-- Create additional indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_date ON public.views(view_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_project_date ON public.views(project_id, view_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_user_date ON public.views(user_id, view_date) WHERE user_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.views.session_id IS 'Unique session identifier for tracking unique visitors';
COMMENT ON COLUMN public.views.view_date IS 'Date of the view for time-based analytics';
COMMENT ON INDEX idx_views_project_session IS 'Unique constraint: one view per session per project';

-- Update RLS policy to include new columns
DROP POLICY IF EXISTS "Anyone can insert views" ON public.views;
CREATE POLICY "Anyone can insert views" ON public.views
  FOR INSERT WITH CHECK (true);
