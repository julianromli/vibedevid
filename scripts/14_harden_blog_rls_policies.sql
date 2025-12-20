-- Harden blog RLS policies
-- - Avoid exposing role checks for arbitrary UUIDs
-- - Avoid multiple permissive SELECT policies (performance)
-- - Keep existing app behavior: users can report, public can read tags

-- Drop policies first (they may depend on helper functions)
DROP POLICY IF EXISTS "Only admins can manage post tags" ON public.post_tags;
DROP POLICY IF EXISTS "Post tags are viewable by everyone" ON public.post_tags;

DROP POLICY IF EXISTS "Blog post tags are viewable by everyone" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Authors can insert blog post tags" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Authors can delete blog post tags" ON public.blog_post_tags;

DROP POLICY IF EXISTS "Users can create blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can view blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can update blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can delete blog reports" ON public.blog_reports;

-- Replace helper with no-arg version (prevents probing other users)
DROP FUNCTION IF EXISTS public.is_admin_or_moderator(UUID);

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (SELECT auth.uid())
      AND u.role IN (0, 1)
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_moderator() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator() TO anon, authenticated;

-- ------------------------------------------------------------
-- post_tags
-- ------------------------------------------------------------
CREATE POLICY "Post tags are viewable by everyone"
ON public.post_tags
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert post tags"
ON public.post_tags
FOR INSERT
WITH CHECK (public.is_admin_or_moderator());

CREATE POLICY "Admins can update post tags"
ON public.post_tags
FOR UPDATE
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE POLICY "Admins can delete post tags"
ON public.post_tags
FOR DELETE
USING (public.is_admin_or_moderator());

-- ------------------------------------------------------------
-- blog_post_tags
-- ------------------------------------------------------------
CREATE POLICY "Blog post tags are viewable by everyone"
ON public.blog_post_tags
FOR SELECT
USING (true);

CREATE POLICY "Authors can insert blog post tags"
ON public.blog_post_tags
FOR INSERT
WITH CHECK (
  public.is_admin_or_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = blog_post_tags.post_id
      AND p.author_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Authors can delete blog post tags"
ON public.blog_post_tags
FOR DELETE
USING (
  public.is_admin_or_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = blog_post_tags.post_id
      AND p.author_id = (SELECT auth.uid())
  )
);

-- ------------------------------------------------------------
-- blog_reports
-- ------------------------------------------------------------
CREATE POLICY "Users can create blog reports"
ON public.blog_reports
FOR INSERT
WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view blog reports"
ON public.blog_reports
FOR SELECT
USING (public.is_admin_or_moderator());

CREATE POLICY "Admins can update blog reports"
ON public.blog_reports
FOR UPDATE
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE POLICY "Admins can delete blog reports"
ON public.blog_reports
FOR DELETE
USING (public.is_admin_or_moderator());
