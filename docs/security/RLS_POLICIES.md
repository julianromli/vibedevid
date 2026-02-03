# Row Level Security (RLS) Policies

## Overview

VibeDev ID uses Supabase Row Level Security to enforce data access control at the database level. All tables have RLS enabled with FORCE mode to prevent bypass.

## Security Principles

1. **Server-Side Validation**: Always use `getUser()` for token validation
2. **Client-Side Performance**: Use `getSession()` with real-time sync
3. **Force RLS**: Enabled on all tables to prevent owner bypass
4. **Function Security**: All functions use fixed search_path

## RLS Status

| Table | RLS Enabled | Force RLS | Policies |
|-------|-------------|-----------|----------|
| users | ✅ | ✅ | 3 (view all, insert own, update own) |
| projects | ✅ | ✅ | 4 (view all, insert/update/delete own) |
| comments | ✅ | ✅ | 4 (view all, insert guest+auth, update/delete own) |
| likes | ✅ | ✅ | 3 (view all, insert/delete own) |
| views | ✅ | ✅ | 4 (view all, insert secure, update/delete own) |
| posts | ✅ | ✅ | 5 (view published, author full CRUD) |
| blog_post_tags | ✅ | ✅ | 3 (view all, insert/delete own) |
| blog_reports | ✅ | ✅ | 2 (insert own, view own) |
| post_tags | ✅ | ✅ | 1 (view all) |
| categories | ✅ | ✅ | 1 (view all) |
| vibe_videos | ✅ | ✅ | 4 (view all, authenticated CRUD) |
| events | ✅ | ✅ | 3 (view approved, submit own, view own pending) |
| faqs | ✅ | ✅ | 4 (view all, admin CRUD) |

## Migration Scripts

- `scripts/01_create_tables.sql` - Initial RLS setup
- `scripts/18_force_rls_security.sql` - FORCE RLS enablement (CRITICAL)
- `scripts/19_fix_function_security.sql` - Function search_path fix

## Authentication Architecture

### Server-Side (Secure)

```typescript
// lib/server/auth.ts
import { createClient } from '@/lib/supabase/server'

export async function getServerSession() {
  const supabase = await createClient()
  
  // ✅ SECURE: Validates token server-side
  const { data: { user } } = await supabase.auth.getUser()
  
  return user ? { user } : null
}
```

**Why `getUser()` on server?**
- Validates JWT token signature
- Checks token expiration
- Prevents cookie tampering attacks
- Required for secure server-side auth

### Client-Side (Performance)

```typescript
// hooks/useAuth.ts
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  useEffect(() => {
    const supabase = createClient()
    
    // ✅ SAFE: Fast client-side session check
    // Real-time sync via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          setAuthReady(true)
          // Handle session...
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
}
```

**Why `onAuthStateChange` on client?**
- Fast initial load (no network roundtrip)
- Real-time session updates
- Middleware refreshes tokens (uses `getUser()`)
- Client state synced automatically

## Policy Examples

### Users Table

```sql
-- View all profiles (public)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Insert own profile only
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update own profile only
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);
```

### Projects Table

```sql
-- View all projects (public)
CREATE POLICY "Projects are viewable by everyone" 
ON public.projects FOR SELECT 
USING (true);

-- Create own projects
CREATE POLICY "Users can insert own projects" 
ON public.projects FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Update own projects
CREATE POLICY "Users can update own projects" 
ON public.projects FOR UPDATE 
USING (auth.uid() = author_id);

-- Delete own projects
CREATE POLICY "Users can delete own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = author_id);
```

### Comments Table

```sql
-- View all comments (public)
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

-- Authenticated users can comment
CREATE POLICY "Authenticated users can insert comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Guests can comment (with name)
CREATE POLICY "Guests can insert comments with name" 
ON public.comments FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL AND 
  author_name IS NOT NULL
);

-- Update own comments only
CREATE POLICY "Users can update own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id);

-- Delete own comments only
CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);
```

### Blog Posts Table

```sql
-- View published posts (public)
CREATE POLICY "Published posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (published_at IS NOT NULL);

-- Authors view own drafts
CREATE POLICY "Authors can view own drafts" 
ON public.posts FOR SELECT 
USING (auth.uid() = author_id);

-- Authors create posts
CREATE POLICY "Authors can insert posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- Authors update own posts
CREATE POLICY "Authors can update own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

-- Authors delete own posts
CREATE POLICY "Authors can delete own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);
```

## Verification

### Check RLS Status

Run this query to verify RLS status:

```sql
SELECT 
  tablename,
  (SELECT relrowsecurity 
   FROM pg_class c 
   WHERE c.oid = ('public.' || tablename)::regclass) AS rls_enabled,
  (SELECT relforcerowsecurity 
   FROM pg_class c 
   WHERE c.oid = ('public.' || tablename)::regclass) AS force_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected result**: All tables show `rls_enabled: true` AND `force_rls: true`.

### Check Function Security

Verify trigger functions have secure search_path:

```sql
SELECT 
  proname AS function_name,
  prosecdef AS is_security_definer,
  proconfig AS function_settings
FROM pg_proc
WHERE proname = 'update_updated_at_column'
  AND pronamespace = 'public'::regnamespace;
```

**Expected result**: `function_settings` contains `search_path=public, pg_temp`.

### Check Active Policies

List all RLS policies:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Security Best Practices

### 1. Always Use Server-Side Auth for Mutations

```typescript
// ✅ GOOD: Server action validates auth
'use server'
export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Proceed with mutation...
}
```

### 2. Never Trust Client-Side Session for Authorization

```typescript
// ❌ BAD: Client-side session check for authorization
'use client'
export function DeleteButton({ projectId }: Props) {
  const { user } = useAuth() // Client-side session
  
  if (!user) return null // INSECURE! Can be bypassed
  
  return <button onClick={() => deleteProject(projectId)}>Delete</button>
}

// ✅ GOOD: Server-side validation
'use server'
export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // RLS policies enforce ownership check
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  
  if (error) {
    return { success: false, error: 'Delete failed' }
  }
  
  return { success: true }
}
```

### 3. Use RLS Policies for Defense in Depth

Even with server-side auth, RLS provides an additional security layer:

```sql
-- If server code is compromised, RLS still prevents unauthorized access
CREATE POLICY "Users can delete own projects" 
ON public.projects FOR DELETE 
USING (auth.uid() = author_id);
```

### 4. Test RLS Policies

Use Supabase SQL Editor to test policies:

```sql
-- Simulate user context
SET request.jwt.claims.sub = 'user-uuid-here';

-- Try unauthorized action (should fail)
DELETE FROM projects WHERE id = 'project-id-here';

-- Reset context
RESET request.jwt.claims.sub;
```

## Common Vulnerabilities Fixed

### 1. RLS Bypass via Table Owner

**Vulnerability**: Without FORCE RLS, postgres role can bypass policies.

**Fix**: `ALTER TABLE users FORCE ROW LEVEL SECURITY;`

### 2. Search Path Injection

**Vulnerability**: SECURITY DEFINER functions with mutable search_path.

**Fix**: `SET search_path = public, pg_temp` on all SECURITY DEFINER functions.

### 3. Client-Side Auth for Mutations

**Vulnerability**: Trusting client-side session for authorization.

**Fix**: Always validate with `supabase.auth.getUser()` in server actions.

## Incident Response

If RLS policy is bypassed:

1. **Immediate**: Disable affected table access
2. **Investigate**: Check audit logs for unauthorized access
3. **Fix**: Update RLS policies to close gap
4. **Verify**: Test policy with all user roles
5. **Monitor**: Set up alerts for policy violations

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Server-Side](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [PostgreSQL Search Path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)

## Last Updated

2026-02-03 - Migration 18 & 19 (Force RLS + Function Security)
