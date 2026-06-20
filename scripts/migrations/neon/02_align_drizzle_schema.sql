-- Align existing Neon databases with the Drizzle schema after the initial bootstrap.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

ALTER TABLE views
  ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS account_user_provider_idx ON "account"(user_id, provider_id);

CREATE TABLE IF NOT EXISTS _migration_checkpoints (
  phase TEXT PRIMARY KEY,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_counts JSONB,
  target_counts JSONB,
  notes TEXT
);

CREATE OR REPLACE FUNCTION create_profile_for_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  attempt INTEGER := 0;
BEGIN
  base_username := lower(regexp_replace(
    coalesce(nullif(NEW.name, ''), split_part(NEW.email, '@', 1), 'user'),
    '[^a-zA-Z0-9_]+',
    '_',
    'g'
  ));
  base_username := trim(both '_' from base_username);
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  LOOP
    candidate_username := CASE
      WHEN attempt = 0 THEN base_username
      ELSE base_username || '_' || attempt::text
    END;

    BEGIN
      INSERT INTO users (id, username, display_name, avatar_url, joined_at, updated_at)
      VALUES (
        NEW.id,
        candidate_username,
        coalesce(nullif(NEW.name, ''), split_part(NEW.email, '@', 1), 'User'),
        NEW.image,
        NEW.created_at,
        NEW.updated_at
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = coalesce(users.avatar_url, EXCLUDED.avatar_url),
        updated_at = EXCLUDED.updated_at;
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      attempt := attempt + 1;
      IF attempt > 100 THEN
        RAISE;
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_profile_for_auth_user ON "user";
CREATE TRIGGER trg_create_profile_for_auth_user
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_auth_user();
