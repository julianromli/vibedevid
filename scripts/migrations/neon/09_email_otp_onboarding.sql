-- Email OTP sign-in: new accounts claim a username during onboarding.
-- Idempotent. `bun run migrate:schema` re-applies every file in order,
-- so this file must be safe to run many times.
-- Apply BEFORE deploying the app: Drizzle selects users.username_claimed_at.
-- Safe with the previous app still running: it only adds a nullable column
-- and marks every existing profile as claimed. The signup trigger change
-- lives in 10_email_otp_signup_trigger.sql so the old signup form keeps
-- using the username people type until the new app is live.

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
