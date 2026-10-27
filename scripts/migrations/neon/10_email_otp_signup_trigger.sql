-- Email OTP sign-in: new auth users get a temporary username `u_<10 hex>`
-- and stay unclaimed until onboarding. Replaces the function from 02.
-- Idempotent (CREATE OR REPLACE, DROP TRIGGER IF EXISTS).
-- Needs 09 (users.username_claimed_at). Apply right AFTER the OTP app is
-- deployed: the previous app's signup form sends the chosen username as
-- `name`, and this trigger ignores it.
-- Until it runs, new OTP users get an email-derived username and still go
-- through onboarding because username_claimed_at stays NULL.

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
