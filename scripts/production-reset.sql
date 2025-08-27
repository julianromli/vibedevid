-- ================================================
-- PRODUCTION RESET SCRIPT - VibeDev Database
-- ================================================
-- PERHATIAN: Script ini akan MENGHAPUS semua data 
-- dari tables: comments, likes, views, projects
-- Users akan tetap dipertahankan!
-- ================================================
-- Created: 2025-08-27
-- Purpose: Clean reset for production launch
-- Author: VibeDev Team
-- ================================================

-- 1. Disable foreign key checks sementara (optional, untuk safety)
SET session_replication_role = replica;

-- 2. Delete all comments (paling dependent)
DELETE FROM comments;
COMMIT;

-- 3. Delete all likes 
DELETE FROM likes;
COMMIT;

-- 4. Delete all views
DELETE FROM views;
COMMIT;

-- 5. Delete all projects (parent table)
DELETE FROM projects;
COMMIT;

-- 6. Reset auto-increment sequences ke 1
ALTER SEQUENCE IF EXISTS comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS likes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS views_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;

-- 7. Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- 8. Verify reset (uncomment untuk check hasil)
-- SELECT COUNT(*) as comments_count FROM comments;
-- SELECT COUNT(*) as likes_count FROM likes;
-- SELECT COUNT(*) as views_count FROM views;
-- SELECT COUNT(*) as projects_count FROM projects;
-- SELECT COUNT(*) as users_count FROM users; -- should remain unchanged

-- ================================================
-- EXECUTION INSTRUCTIONS:
-- ================================================
-- 1. Backup database dulu (optional tapi recommended)
-- 2. Execute script ini via Supabase Dashboard SQL Editor
-- 3. Atau via MCP Supabase tool: execute_sql
-- 4. Verify semua content tables kosong
-- 5. Test create new project untuk confirm reset berhasil
-- ================================================

-- ================================================
-- EXPECTED RESULTS AFTER EXECUTION:
-- ================================================
-- ✅ comments table: 0 rows
-- ✅ likes table: 0 rows  
-- ✅ views table: 0 rows
-- ✅ projects table: 0 rows
-- ✅ users table: unchanged (preserved)
-- ✅ All ID sequences reset to start from 1
-- ✅ Authentication system intact
-- ================================================

-- SCRIPT COMPLETE - Ready for Production Launch! 🚀
