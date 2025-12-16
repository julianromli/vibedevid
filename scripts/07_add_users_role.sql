-- Add users.role for verified/admin badges
-- Idempotent migration: safe to re-run

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN role INTEGER DEFAULT 2;
  END IF;
END $$;

-- Backfill nulls (if any)
UPDATE public.users SET role = 2 WHERE role IS NULL;

-- Add constraint (only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check
      CHECK (role = ANY (ARRAY[0, 1, 2]));
  END IF;
END $$;
