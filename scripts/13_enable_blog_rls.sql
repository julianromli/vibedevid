-- Enable RLS for blog tagging/reporting tables
-- Idempotent: safe to run multiple times

-- Helper: treat role 0 (admin) and 1 (moderator) as elevated
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(check_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = check_uid
      AND u.role IN (0, 1)
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_or_moderator(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator(UUID) TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_reports ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- post_tags
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Post tags are viewable by everyone" ON public.post_tags;
DROP POLICY IF EXISTS "Only admins can manage post tags" ON public.post_tags;

CREATE POLICY "Post tags are viewable by everyone"
ON public.post_tags
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage post tags"
ON public.post_tags
FOR ALL
USING (public.is_admin_or_moderator((SELECT auth.uid())))
WITH CHECK (public.is_admin_or_moderator((SELECT auth.uid())));

-- ------------------------------------------------------------
-- blog_post_tags
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Blog post tags are viewable by everyone" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Authors can insert blog post tags" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Authors can delete blog post tags" ON public.blog_post_tags;

CREATE POLICY "Blog post tags are viewable by everyone"
ON public.blog_post_tags
FOR SELECT
USING (true);

CREATE POLICY "Authors can insert blog post tags"
ON public.blog_post_tags
FOR INSERT
WITH CHECK (
  public.is_admin_or_moderator((SELECT auth.uid()))
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
  public.is_admin_or_moderator((SELECT auth.uid()))
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
DROP POLICY IF EXISTS "Users can create blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can view blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can update blog reports" ON public.blog_reports;
DROP POLICY IF EXISTS "Admins can delete blog reports" ON public.blog_reports;

CREATE POLICY "Users can create blog reports"
ON public.blog_reports
FOR INSERT
WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view blog reports"
ON public.blog_reports
FOR SELECT
USING (public.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admins can update blog reports"
ON public.blog_reports
FOR UPDATE
USING (public.is_admin_or_moderator((SELECT auth.uid())))
WITH CHECK (public.is_admin_or_moderator((SELECT auth.uid())));

CREATE POLICY "Admins can delete blog reports"
ON public.blog_reports
FOR DELETE
USING (public.is_admin_or_moderator((SELECT auth.uid())));

-- ------------------------------------------------------------
-- Performance: add missing foreign key indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id
  ON public.blog_post_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_blog_reports_comment_id
  ON public.blog_reports(comment_id);

CREATE INDEX IF NOT EXISTS idx_blog_reports_reporter_id
  ON public.blog_reports(reporter_id);
