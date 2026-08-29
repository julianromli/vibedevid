-- Harden Neon schema: uniqueness, XOR checks, indexes, auth cleanup, drop staging.
-- Idempotent. Applied by `bun run migrate:schema` after 01 and 02.

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE UNIQUE INDEX IF NOT EXISTS likes_user_project_uidx
  ON likes (user_id, project_id)
  WHERE project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS likes_user_post_uidx
  ON likes (user_id, post_id)
  WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_key ON posts (slug);

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_views_project_id_view_date ON views (project_id, view_date);

CREATE INDEX IF NOT EXISTS idx_events_approved_date ON events (approved, date);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_parent_xor'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_parent_xor
      CHECK ((project_id IS NULL) <> (post_id IS NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_parent_xor'
  ) THEN
    ALTER TABLE likes
      ADD CONSTRAINT likes_parent_xor
      CHECK ((project_id IS NULL) <> (post_id IS NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'views_parent_xor'
  ) THEN
    ALTER TABLE views
      ADD CONSTRAINT views_parent_xor
      CHECK ((project_id IS NULL) <> (post_id IS NULL));
  END IF;
END $$;

DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS account_userid_idx;

DELETE FROM session WHERE expires_at < NOW();
DELETE FROM verification WHERE expires_at < NOW();

DROP SCHEMA IF EXISTS supabase_auth_staging CASCADE;
