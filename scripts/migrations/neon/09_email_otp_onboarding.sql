-- Email OTP sign-in: new accounts claim a username during onboarding.
-- Idempotent. `bun run migrate:schema` re-applies every file in order,
-- so this file must be safe to run many times.
-- Apply BEFORE deploying the app: Drizzle selects users.username_claimed_at.

-- 1. Claimed marker. NULL means the user still has a temporary username.
--    Backfill runs only on the run that adds the column, so later runs
--    never mark a new unclaimed user as claimed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'username_claimed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN username_claimed_at TIMESTAMPTZ;
    UPDATE users SET username_claimed_at = coalesce(joined_at, NOW());
  END IF;
END
$$;

-- 2. New auth users get a temporary username `u_<10 hex>` and stay
--    unclaimed until onboarding. Replaces the function from 02.
CREATE OR REPLACE FUNCTION create_profile_for_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  attempt INTEGER := 0;
BEGIN
  base_username := 'u_' || substr(md5(NEW.id::text), 1, 10);

  LOOP
    candidate_username := CASE
      WHEN attempt = 0 THEN base_username
      ELSE base_username || '_' || attempt::text
    END;

    BEGIN
      INSERT INTO users (id, username, display_name, avatar_url, joined_at, updated_at, username_claimed_at)
      VALUES (
        NEW.id,
        candidate_username,
        coalesce(nullif(NEW.name, ''), candidate_username),
        NEW.image,
        NEW.created_at,
        NEW.updated_at,
        NULL
      )
      ON CONFLICT (id) DO UPDATE SET
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
