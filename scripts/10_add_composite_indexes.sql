-- Migration: Add missing composite indexes for query optimization
-- Date: 2025-11-10
-- Adds 4 strategic indexes to optimize common query patterns

-- ============================================================================
-- COMPOSITE INDEXES FOR MULTI-COLUMN QUERIES
-- ============================================================================

-- Composite index for like checks (project + user)
-- Optimizes: toggleLike() which checks if user already liked a project
-- Query pattern: WHERE project_id = X AND user_id = Y
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_project_user 
ON likes(project_id, user_id);

-- Composite index for comment queries with time ordering
-- Optimizes: getComments() which filters by project and orders by created_at
-- Query pattern: WHERE project_id = X ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_project_created 
ON comments(project_id, created_at DESC);

-- Composite index for user profile project queries
-- Optimizes: Profile page queries that show user's projects sorted by date
-- Query pattern: WHERE author_id = X ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_author_created 
ON projects(author_id, created_at DESC);

-- ============================================================================
-- SINGLE-COLUMN INDEXES FOR AUTH/LOOKUP OPERATIONS
-- ============================================================================

-- Email lookup index for authentication flows
-- Optimizes: Signup/signin operations that look up users by email
-- Query pattern: WHERE email = X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_likes_project_user IS 'Composite index for checking user likes on projects - optimizes toggleLike()';
COMMENT ON INDEX idx_comments_project_created IS 'Optimizes comment listing with time ordering - used in getComments()';
COMMENT ON INDEX idx_projects_author_created IS 'Optimizes user profile project queries - used in fetchUserProjects()';
COMMENT ON INDEX idx_users_email IS 'Email lookup index for authentication flows';

-- ============================================================================
-- NOTES
-- ============================================================================

-- Using CONCURRENTLY to avoid table locks during index creation
-- This allows the application to continue running while indexes are built
-- Index creation may take longer but is safer for production deployments
