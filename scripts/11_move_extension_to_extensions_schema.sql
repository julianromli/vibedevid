-- Migration: Move unaccent extension to extensions schema
-- Date: 2025-11-10
-- Fixes: extension_in_public warning from Supabase advisors
-- Best Practice: Extensions should not be in public schema to avoid namespace pollution

-- ============================================================================
-- CREATE EXTENSIONS SCHEMA
-- ============================================================================

-- Create dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- ============================================================================
-- MOVE EXTENSION
-- ============================================================================

-- Move unaccent extension from public to extensions schema
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- ============================================================================
-- UPDATE SEARCH PATH
-- ============================================================================

-- Ensure extensions schema is in search path so functions are accessible
-- This makes extension functions available without schema qualification
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Note: If you're not using default 'postgres' database name, update above

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify the extension moved correctly, run:
-- SELECT * FROM pg_extension WHERE extname = 'unaccent';
-- Should show extnamespace pointing to extensions schema

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- If you need to rollback this change:
-- ALTER EXTENSION unaccent SET SCHEMA public;
-- ALTER DATABASE postgres SET search_path TO public;
