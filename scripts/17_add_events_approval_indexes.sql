-- Migration: Add indexes for AI Events approval system
-- Date: 2025-02-02
-- Purpose: Optimize queries for admin event approval workflow
-- Related: AI Events approval dashboard feature

-- =============================================================================
-- INDEX 1: Partial index for pending events
-- Purpose: Fast lookup of events awaiting approval
-- Query pattern: WHERE approved = false ORDER BY created_at DESC
-- Impact: 5-20x faster pending events query, smaller index size
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_events_pending_created 
ON events (created_at DESC) 
WHERE approved = false;

-- =============================================================================
-- INDEX 2: Foreign key index for submitted_by
-- Purpose: Fast JOIN with users table when fetching pending events with submitter info
-- Query pattern: SELECT ... FROM events JOIN users ON events.submitted_by = users.id
-- Impact: Eliminates sequential scan on events during JOIN
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_events_submitted_by 
ON events (submitted_by);

-- =============================================================================
-- INDEX 3: Composite index for public event listings
-- Purpose: Optimize public event list queries (approved events only)
-- Query pattern: WHERE approved = true AND category = ? ORDER BY date
-- Impact: Index-only scan for event list page, faster filtering by category
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_events_approved_category_date 
ON events (approved, category, date) 
INCLUDE (name, slug, location_type, cover_image, status);

-- =============================================================================
-- INDEX 4: Partial index for approved events by date
-- Purpose: Fast retrieval of upcoming/past events
-- Query pattern: WHERE approved = true ORDER BY date
-- Impact: Optimized for event list sorting by date
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_events_approved_date 
ON events (date ASC) 
WHERE approved = true;

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON INDEX idx_events_pending_created IS 'Partial index for admin approval dashboard - pending events only';
COMMENT ON INDEX idx_events_submitted_by IS 'Foreign key index for user-event relationship lookups';
COMMENT ON INDEX idx_events_approved_category_date IS 'Covering index for public event listings with category filter';
COMMENT ON INDEX idx_events_approved_date IS 'Partial index for chronological event listings';
