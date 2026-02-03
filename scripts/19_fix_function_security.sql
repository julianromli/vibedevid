-- ============================================================================
-- Migration: 19 - Fix Function Search Path Vulnerability
-- Purpose: Secure trigger functions against search_path injection attacks
-- 
-- SECURITY VULNERABILITY:
-- Functions with SECURITY DEFINER and mutable search_path can be exploited
-- by attackers to execute arbitrary code via search_path manipulation.
-- 
-- FIX: Set fixed search_path to prevent SQL injection attacks
-- 
-- Reference: Supabase Postgres Best Practices - Function Security
-- CVE Reference: Similar to CVE-2018-1058 (PostgreSQL search_path attack)
-- ============================================================================

-- ============================================================================
-- Fix update_updated_at_column trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- CRITICAL: Prevents search_path injection
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS 
'Trigger function to auto-update updated_at timestamp.
SECURITY: Uses fixed search_path to prevent SQL injection via search_path manipulation.
Updated: 2026-02-03 (Migration 19)';

-- ============================================================================
-- VERIFICATION QUERY
-- Confirm function has secure search_path configuration
-- ============================================================================

-- Uncomment to verify:
-- SELECT 
--   proname AS function_name,
--   prosecdef AS is_security_definer,
--   proconfig AS function_settings
-- FROM pg_proc
-- WHERE proname = 'update_updated_at_column'
--   AND pronamespace = 'public'::regnamespace;

-- Expected result:
-- function_name            | is_security_definer | function_settings
-- -------------------------+---------------------+---------------------------
-- update_updated_at_column | true                | {search_path=public, pg_temp}

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- Why this matters:
-- 1. SECURITY DEFINER functions run with privileges of the function owner
-- 2. Without fixed search_path, attackers can create malicious schemas
-- 3. Attacker sets search_path to their schema before calling function
-- 4. Function executes attacker's code instead of intended code
-- 5. Result: Privilege escalation and potential data breach

-- Best practices for SECURITY DEFINER functions:
-- 1. Always set search_path explicitly
-- 2. Use "public, pg_temp" for most cases
-- 3. Minimize use of SECURITY DEFINER when possible
-- 4. Audit all SECURITY DEFINER functions regularly

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To revert to original function (NOT RECOMMENDED):
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$;
