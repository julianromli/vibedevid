-- Migration: Add missing database indexes for performance optimization
-- Critical indexes for slug-based lookups and foreign key relationships
-- Date: 2025-11-10

-- ============================================================================
-- CRITICAL INDEXES (Phase 1)
-- ============================================================================

-- MOST CRITICAL: Projects slug index
-- Used in nearly every project lookup (getProjectBySlug, editProject, deleteProject, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_slug 
ON projects(slug);

-- Foreign key index for likes.user_id
-- Used heavily in getLikeStatus, toggleLike, getBatchLikeStatus
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id 
ON likes(user_id);

-- Composite index for like lookups
-- Optimizes queries that check if user liked a specific project
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_project_user 
ON likes(project_id, user_id);

-- ============================================================================
-- HIGH PRIORITY INDEXES (Phase 2)
-- ============================================================================

-- Foreign key index for comments.user_id
-- Needed for filtering user's comments and JOIN operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id 
ON comments(user_id);

-- Composite index for comment queries with ordering
-- Optimizes getComments() which filters by project and orders by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_project_created 
ON comments(project_id, created_at DESC);

-- Partial index for views.user_id (non-null only)
-- Used for analytics and user view tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_user_id 
ON views(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- OPTIMIZATION INDEXES (Phase 3)
-- ============================================================================

-- Composite index for user profile queries
-- Optimizes fetchUserProjects() which filters by author and orders by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_author_created 
ON projects(author_id, created_at DESC);

-- Email lookup index for auth operations
-- Used during signup/signin flows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_projects_slug IS 'Primary lookup index for slug-based project access - CRITICAL';
COMMENT ON INDEX idx_likes_project_user IS 'Composite index for checking user likes on projects';
COMMENT ON INDEX idx_comments_project_created IS 'Optimizes comment listing with time ordering';
COMMENT ON INDEX idx_projects_author_created IS 'Optimizes user profile project queries';
COMMENT ON INDEX idx_likes_user_id IS 'Foreign key index for user likes';
COMMENT ON INDEX idx_comments_user_id IS 'Foreign key index for user comments';
COMMENT ON INDEX idx_views_user_id IS 'Partial index for authenticated user views';
COMMENT ON INDEX idx_users_email IS 'Email lookup index for authentication';
