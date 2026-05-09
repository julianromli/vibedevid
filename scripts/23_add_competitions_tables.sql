-- Mini Vibeathon competition domain
-- Adds reusable competition tables, RLS, and indexes.

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_text TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  rules_markdown TEXT NOT NULL DEFAULT '',
  judging_criteria_markdown TEXT NOT NULL DEFAULT '',
  faq_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  hero_primary_cta_label TEXT,
  hero_secondary_cta_label TEXT,
  judging_vote_weight NUMERIC(4, 2) NOT NULL DEFAULT 0.30,
  judging_judge_weight NUMERIC(4, 2) NOT NULL DEFAULT 0.70,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competitions_starts_before_ends CHECK (starts_at < ends_at),
  CONSTRAINT competitions_weights_sum_to_one CHECK ((judging_vote_weight + judging_judge_weight) = 1.00)
);

CREATE TABLE IF NOT EXISTS public.competition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competition_categories_unique_slug UNIQUE (competition_id, slug)
);

CREATE TABLE IF NOT EXISTS public.competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.competition_categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  process_summary TEXT NOT NULL,
  ai_tools_used TEXT[] NOT NULL DEFAULT '{}'::text[],
  tech_stacks TEXT[] NOT NULL DEFAULT '{}'::text[],
  demo_url TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  thumbnail_key TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  gallery_keys TEXT[] NOT NULL DEFAULT '{}'::text[],
  video_url TEXT,
  comment_count INTEGER NOT NULL DEFAULT 0,
  vote_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'disqualified')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  comments_locked BOOLEAN NOT NULL DEFAULT false,
  moderation_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competition_entries_demo_https CHECK (demo_url ~ '^https://'),
  CONSTRAINT competition_entries_repo_https CHECK (repo_url ~ '^https://'),
  CONSTRAINT competition_entries_video_https CHECK (video_url IS NULL OR video_url ~ '^https://'),
  CONSTRAINT competition_entries_gallery_limit CHECK (COALESCE(array_length(gallery_urls, 1), 0) <= 5),
  CONSTRAINT competition_entries_gallery_keys_limit CHECK (COALESCE(array_length(gallery_keys, 1), 0) <= 5),
  CONSTRAINT competition_entries_gallery_pairing CHECK (COALESCE(array_length(gallery_keys, 1), 0) <= COALESCE(array_length(gallery_urls, 1), 0)),
  CONSTRAINT competition_entries_tech_stack_limit CHECK (COALESCE(array_length(tech_stacks, 1), 0) <= 8),
  CONSTRAINT competition_entries_has_media CHECK (video_url IS NOT NULL OR COALESCE(array_length(gallery_urls, 1), 0) > 0)
);

CREATE TABLE IF NOT EXISTS public.competition_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competition_votes_unique_vote UNIQUE (competition_entry_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.competition_judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  judge_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  execution_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  creativity_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ai_usage_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ux_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  completeness_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  total_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competition_judge_scores_unique_judge UNIQUE (competition_entry_id, judge_user_id)
);

CREATE TABLE IF NOT EXISTS public.competition_entry_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT competition_entry_reports_unique_report UNIQUE (competition_entry_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_competitions_status_starts_at
  ON public.competitions(status, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitions_status_ends_at
  ON public.competitions(status, ends_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_categories_competition_sort
  ON public.competition_categories(competition_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_newest
  ON public.competition_entries(competition_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_oldest
  ON public.competition_entries(competition_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_category
  ON public.competition_entries(competition_id, category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_user
  ON public.competition_entries(competition_id, user_id);

CREATE INDEX IF NOT EXISTS idx_competition_entries_published_top
  ON public.competition_entries(competition_id, vote_count DESC, submitted_at ASC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_competition_entries_published_featured
  ON public.competition_entries(competition_id, is_featured, created_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_competition_votes_entry_id
  ON public.competition_votes(competition_entry_id);

CREATE INDEX IF NOT EXISTS idx_competition_votes_competition_created
  ON public.competition_votes(competition_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_votes_user_created
  ON public.competition_votes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_judge_scores_competition_entry
  ON public.competition_judge_scores(competition_id, competition_entry_id);

CREATE INDEX IF NOT EXISTS idx_competition_judge_scores_judge_created
  ON public.competition_judge_scores(judge_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competition_entry_reports_entry
  ON public.competition_entry_reports(competition_entry_id);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entry_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.competitions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.competition_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.competition_votes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.competition_judge_scores FORCE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entry_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Competitions are viewable by everyone" ON public.competitions;
DROP POLICY IF EXISTS "Admins can manage competitions" ON public.competitions;

CREATE POLICY "Competitions are viewable by everyone"
ON public.competitions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage competitions"
ON public.competitions
FOR ALL
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Competition categories are viewable by everyone" ON public.competition_categories;
DROP POLICY IF EXISTS "Admins can manage competition categories" ON public.competition_categories;

CREATE POLICY "Competition categories are viewable by everyone"
ON public.competition_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage competition categories"
ON public.competition_categories
FOR ALL
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Competition entries are readable by public, owners, and admins" ON public.competition_entries;
DROP POLICY IF EXISTS "Authenticated users can submit competition entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Owners can delete active competition entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Admins can moderate competition entries" ON public.competition_entries;

CREATE POLICY "Competition entries are readable by public, owners, and admins"
ON public.competition_entries
FOR SELECT
USING (
  (
    status = 'published'
    AND deleted_at IS NULL
  )
  OR user_id = (SELECT auth.uid())
  OR public.is_admin_or_moderator()
);

CREATE POLICY "Authenticated users can submit competition entries"
ON public.competition_entries
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND status = 'published'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.competitions c
    WHERE c.id = competition_entries.competition_id
      AND c.status = 'active'
      AND now() >= c.starts_at
      AND now() < c.ends_at
  )
  AND EXISTS (
    SELECT 1
    FROM public.competition_categories cc
    WHERE cc.id = competition_entries.category_id
      AND cc.competition_id = competition_entries.competition_id
      AND cc.is_active = true
  )
);

CREATE POLICY "Owners can delete active competition entries"
ON public.competition_entries
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.competitions c
    WHERE c.id = competition_entries.competition_id
      AND c.status = 'active'
      AND now() >= c.starts_at
      AND now() < c.ends_at
  )
);

CREATE POLICY "Admins can moderate competition entries"
ON public.competition_entries
FOR UPDATE
TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Competition votes are viewable by everyone" ON public.competition_votes;
DROP POLICY IF EXISTS "Authenticated users can manage own competition votes" ON public.competition_votes;

CREATE POLICY "Competition votes are viewable by everyone"
ON public.competition_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert own competition votes"
ON public.competition_votes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.competition_entries ce
    JOIN public.competitions c ON c.id = ce.competition_id
    WHERE ce.id = competition_votes.competition_entry_id
      AND ce.competition_id = competition_votes.competition_id
      AND ce.status = 'published'
      AND ce.deleted_at IS NULL
      AND ce.user_id <> (SELECT auth.uid())
      AND c.status = 'active'
      AND now() >= c.starts_at
      AND now() < c.ends_at
  )
);

CREATE POLICY "Authenticated users can delete own competition votes"
ON public.competition_votes
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.competitions c
    WHERE c.id = competition_votes.competition_id
      AND c.status = 'active'
      AND now() >= c.starts_at
      AND now() < c.ends_at
  )
);

DROP POLICY IF EXISTS "Admins can manage competition judge scores" ON public.competition_judge_scores;

CREATE POLICY "Admins can manage competition judge scores"
ON public.competition_judge_scores
FOR ALL
TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins can review competition entry reports" ON public.competition_entry_reports;
DROP POLICY IF EXISTS "Authenticated users can create own competition entry reports" ON public.competition_entry_reports;

CREATE POLICY "Authenticated users can create own competition entry reports"
ON public.competition_entry_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can review competition entry reports"
ON public.competition_entry_reports
FOR ALL
TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP TRIGGER IF EXISTS update_competitions_updated_at ON public.competitions;
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_competition_entries_updated_at ON public.competition_entries;
CREATE TRIGGER update_competition_entries_updated_at
  BEFORE UPDATE ON public.competition_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_competition_judge_scores_updated_at ON public.competition_judge_scores;
CREATE TRIGGER update_competition_judge_scores_updated_at
  BEFORE UPDATE ON public.competition_judge_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
