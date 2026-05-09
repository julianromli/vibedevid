-- Extend unified comments to support blog posts, projects, and competition entries.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS competition_entry_id UUID REFERENCES public.competition_entries(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ALTER COLUMN project_id DROP NOT NULL;

DROP INDEX IF EXISTS idx_comments_post_id;
CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON public.comments(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_competition_entry_id
  ON public.comments(competition_entry_id, created_at DESC);

ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_single_target_check;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_single_target_check
  CHECK (
    (
      CASE WHEN post_id IS NOT NULL THEN 1 ELSE 0 END
      + CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END
      + CASE WHEN competition_entry_id IS NOT NULL THEN 1 ELSE 0 END
    ) = 1
  ) NOT VALID;

ALTER TABLE public.comments
  VALIDATE CONSTRAINT comments_single_target_check;

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Secure comment insertion" ON public.comments;

CREATE POLICY "Authenticated users can insert comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Guests can insert project comments"
ON public.comments
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND author_name IS NOT NULL
  AND project_id IS NOT NULL
  AND post_id IS NULL
  AND competition_entry_id IS NULL
);
