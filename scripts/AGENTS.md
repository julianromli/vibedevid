# Scripts - AI Agent Guidelines

## Package Identity

Database migration scripts and utilities for VibeDev ID. Contains SQL scripts for schema setup, data seeding, and database operations.

**Primary tech**: PostgreSQL (via Supabase), SQL, JavaScript (Node.js)

## Setup & Run

```bash
# Run SQL migrations in order (via Supabase SQL Editor or psql)
# 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14

# Clear database (DANGEROUS - only for development)
node scripts/clear_database.js

# Production database reset (DANGEROUS - requires confirmation)
# Run production-reset.sql via Supabase SQL Editor
```

## Patterns & Conventions

### File Organization

```
scripts/
├── 01_create_tables.sql                  # Initial schema (users, projects, etc.)
├── 02_seed_data.sql                      # Sample data for development
├── 03_create_storage_bucket.sql          # Supabase Storage setup
├── 04_change_projects_id_to_sequential.sql    # Legacy migration
├── 05_add_foreign_key_constraints.sql         # Referential integrity
├── 06_enhance_views_table.sql            # Analytics table enhancements
├── 07_add_users_role.sql                 # User roles and permissions
├── 08_optimize_rls_policies.sql          # RLS policy optimizations
├── 09_consolidate_rls_policies.sql       # Consolidated RLS policies
├── 10_add_composite_indexes.sql          # Performance indexes
├── 11_move_extension_to_extensions_schema.sql # Schema organization
├── 12_add_blog_columns.sql               # Blog table enhancements
├── 13_enable_blog_rls.sql                # Blog RLS policies
├── 14_harden_blog_rls_policies.sql       # Security hardening
├── clear_database.js                     # JavaScript cleanup utility
└── production-reset.sql                  # Production reset script
```

### Naming Rules

- **Migration files**: `##_descriptive_name.sql` (numbered in execution order)
- **One-off scripts**: `descriptive-name.sql` or `descriptive-name.js`
- **Idempotent**: Use `IF NOT EXISTS`, `DROP IF EXISTS`, etc.

### Migration Patterns

#### ✅ DO: Numbered Sequential Migrations

```sql
-- scripts/01_create_tables.sql
-- Create core tables in dependency order

-- Users table (no foreign keys)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (references users)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_author ON public.projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
```

**Example**: [`01_create_tables.sql`](01_create_tables.sql)

#### ✅ DO: Idempotent Migrations

```sql
-- scripts/05_add_foreign_key_constraints.sql
-- Safe to run multiple times

-- Drop constraint if exists, then add
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS fk_projects_author;

ALTER TABLE public.projects
  ADD CONSTRAINT fk_projects_author
  FOREIGN KEY (author_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_projects_author
  ON public.projects(author_id);
```

**Example**: [`05_add_foreign_key_constraints.sql`](05_add_foreign_key_constraints.sql)

#### ✅ DO: Enhanced Analytics Tables

```sql
-- scripts/06_enhance_views_table.sql
-- Session-based analytics

CREATE TABLE IF NOT EXISTS public.views (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_views_project ON public.views(project_id);
CREATE INDEX IF NOT EXISTS idx_views_session ON public.views(session_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON public.views(viewed_at DESC);

-- Unique constraint: one view per session per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_views_unique_session_project
  ON public.views(project_id, session_id);
```

**Example**: [`06_enhance_views_table.sql`](06_enhance_views_table.sql)

#### ✅ DO: User Roles and Permissions

```sql
-- scripts/07_add_users_role.sql
-- Add role column to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

-- Role values: 'user', 'admin', 'moderator'

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
```

**Example**: [`07_add_users_role.sql`](07_add_users_role.sql)

#### ✅ DO: Blog Schema Enhancements

```sql
-- scripts/12_add_blog_columns.sql
-- Add blog-specific columns

ALTER TABLE IF EXISTS public.blog_posts
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.blog_posts
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.blog_posts
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

ALTER TABLE IF EXISTS public.blog_posts
ADD COLUMN IF NOT EXISTS cover_image TEXT;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published_at DESC);
```

**Example**: [`12_add_blog_columns.sql`](12_add_blog_columns.sql)

#### ✅ DO: Seed Data for Development

```sql
-- scripts/02_seed_data.sql
-- Sample data for local development

-- Insert test users (use fixed UUIDs for consistency)
INSERT INTO public.users (id, email, username, display_name, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com', 'alice', 'Alice Developer', '/avatars/alice.png'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com', 'bob', 'Bob Designer', '/avatars/bob.png')
ON CONFLICT (id) DO NOTHING;

-- Insert test projects
INSERT INTO public.projects (id, slug, title, description, author_id, category)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'my-first-app', 'My First App', 'A sample project', '11111111-1111-1111-1111-111111111111', 'Web Development'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'awesome-design', 'Awesome Design', 'Beautiful UI', '22222222-2222-2222-2222-222222222222', 'Design')
ON CONFLICT (id) DO NOTHING;
```

**Example**: [`02_seed_data.sql`](02_seed_data.sql)

#### ✅ DO: Supabase Storage Setup

```sql
-- scripts/03_create_storage_bucket.sql
-- Create storage buckets for file uploads

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create projects bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'projects',
  'projects',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies (RLS)
-- Allow public read
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Example**: [`03_create_storage_bucket.sql`](03_create_storage_bucket.sql)

#### ❌ DON'T: Non-Idempotent Migrations

```sql
-- ❌ BAD: Fails on re-run
ALTER TABLE projects ADD COLUMN slug TEXT;  -- Error if column exists

-- ✅ GOOD: Idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'slug'
  ) THEN
    ALTER TABLE projects ADD COLUMN slug TEXT;
  END IF;
END $$;
```

#### ❌ DON'T: Missing Foreign Key Indexes

```sql
-- ❌ BAD: Foreign key without index (slow queries)
ALTER TABLE projects ADD CONSTRAINT fk_author
  FOREIGN KEY (author_id) REFERENCES users(id);

-- ✅ GOOD: Add index for foreign key
CREATE INDEX idx_projects_author ON projects(author_id);
ALTER TABLE projects ADD CONSTRAINT fk_author
  FOREIGN KEY (author_id) REFERENCES users(id);
```

### Database Cleanup Scripts

#### ⚠️ DANGEROUS: Clear Database (Development Only)

```javascript
// scripts/clear_database.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Admin access
)

async function clearDatabase() {
  console.warn('⚠️  CLEARING ALL DATA FROM DATABASE')

  // Delete in reverse dependency order
  await supabase.from('views').delete().neq('id', 0)
  await supabase.from('likes').delete().neq('id', 0)
  await supabase.from('projects').delete().neq('id', 0)
  await supabase.from('users').delete().neq('id', 0)

  console.log('✅ Database cleared')
}

clearDatabase()
```

**Example**: [`clear_database.js`](clear_database.js)

## Touch Points / Key Files

**Initial Setup** (Run once):

1. [`01_create_tables.sql`](01_create_tables.sql) - Core schema
2. [`02_seed_data.sql`](02_seed_data.sql) - Test data (optional)
3. [`03_create_storage_bucket.sql`](03_create_storage_bucket.sql) - Storage setup

**Schema Evolution**: 4. [`04_change_projects_id_to_sequential.sql`](04_change_projects_id_to_sequential.sql) - Legacy migration 5. [`05_add_foreign_key_constraints.sql`](05_add_foreign_key_constraints.sql) - Add referential integrity 6. [`06_enhance_views_table.sql`](06_enhance_views_table.sql) - Analytics enhancements 7. [`07_add_users_role.sql`](07_add_users_role.sql) - User roles 8. [`08_optimize_rls_policies.sql`](08_optimize_rls_policies.sql) - RLS optimizations 9. [`09_consolidate_rls_policies.sql`](09_consolidate_rls_policies.sql) - Consolidated policies 10. [`10_add_composite_indexes.sql`](10_add_composite_indexes.sql) - Performance indexes 11. [`11_move_extension_to_extensions_schema.sql`](11_move_extension_to_extensions_schema.sql) - Schema organization

**Blog Enhancements**: 12. [`12_add_blog_columns.sql`](12_add_blog_columns.sql) - Blog schema 13. [`13_enable_blog_rls.sql`](13_enable_blog_rls.sql) - Blog RLS 14. [`14_harden_blog_rls_policies.sql`](14_harden_blog_rls_policies.sql) - Security hardening

**Utilities**:

- Clear database: [`clear_database.js`](clear_database.js)
- Production reset: [`production-reset.sql`](production-reset.sql)

## JIT Index Hints

```bash
# List all migration files in order
bunx find scripts -name "*.sql" | sort

# Search for specific table
findstr /s /i "CREATE TABLE" scripts\*.sql

# Search for indexes
findstr /s /i "CREATE INDEX" scripts\*.sql

# Find foreign key constraints
findstr /s /i "FOREIGN KEY" scripts\*.sql

# Find blog-related migrations
findstr /s /i "blog" scripts\*.sql

# Find RLS policies
findstr /s /i "CREATE POLICY" scripts\*.sql
```

## Common Gotchas

- **Execution order matters**: Run numbered scripts in sequence (01 → 02 → 03...)
- **Idempotency**: Always use `IF NOT EXISTS` / `IF EXISTS` for safe re-runs
- **Foreign key indexes**: Always create indexes on foreign key columns for performance
- **RLS policies**: Remember to set Row Level Security policies for tables and storage
- **Service role key**: Some operations require `SUPABASE_SERVICE_ROLE_KEY` (admin access)
- **Production**: NEVER run `clear_database.js` in production
- **Backups**: Always backup before running migrations on production
- **Blog migrations**: Some migrations depend on blog_posts table existing

## Migration Checklist

Before creating a new migration:

- [ ] Number it sequentially (e.g., `15_add_comments_table.sql`)
- [ ] Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- [ ] Add indexes for foreign keys
- [ ] Add indexes for frequently queried columns
- [ ] Test locally before deploying to production
- [ ] Document breaking changes in migration file comments
- [ ] Consider data migration if changing existing columns
- [ ] Update WARP.md if schema changes affect app logic

## Running Migrations

### Local Development (Supabase Local)

```bash
# Start Supabase locally (if using supabase CLI)
npx supabase start

# Run migration
npx supabase db reset  # Reset database with all migrations
# OR
psql -h localhost -U postgres -d postgres -f scripts/01_create_tables.sql
```

### Production (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration file contents
3. Run SQL script
4. Verify execution (check tables/columns)

### Vercel Postgres / Other

```bash
# Run via psql
psql $DATABASE_URL -f scripts/01_create_tables.sql

# Or via Node.js
node -e "import('@supabase/supabase-js').then(({createClient}) => { /* run queries */ })"
```

## Database Best Practices

- **Timestamps**: Always add `created_at` and `updated_at` columns
- **Indexes**: Create indexes on foreign keys, slug fields, and frequently filtered columns
- **Constraints**: Use foreign keys, unique constraints, and check constraints
- **RLS**: Enable Row Level Security for data protection
- **Cascade**: Use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately
- **Text vs VARCHAR**: Use `TEXT` instead of `VARCHAR` in PostgreSQL (no performance difference)
