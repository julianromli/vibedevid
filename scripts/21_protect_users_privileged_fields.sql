-- Prevent users from self-escalating privileged fields on public.users.
-- Admin mutations should flow through service-role backed server actions.

CREATE OR REPLACE FUNCTION public.protect_users_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  jwt_role text := COALESCE((SELECT auth.role()), 'anon');
  auth_user_id uuid := (SELECT auth.uid());
  previous_row jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  next_row jsonb := to_jsonb(NEW);
BEGIN
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF auth_user_id IS DISTINCT FROM NEW.id THEN
      RETURN NEW;
    END IF;

    IF COALESCE((next_row ->> 'role')::integer, 2) <> 2 THEN
      RAISE EXCEPTION 'Role changes require admin access';
    END IF;

    IF COALESCE((next_row ->> 'is_suspended')::boolean, false) THEN
      RAISE EXCEPTION 'Suspension changes require admin access';
    END IF;

    IF next_row ->> 'suspension_reason' IS NOT NULL OR next_row ->> 'suspended_at' IS NOT NULL THEN
      RAISE EXCEPTION 'Suspension metadata requires admin access';
    END IF;

    RETURN NEW;
  END IF;

  IF auth_user_id IS DISTINCT FROM OLD.id THEN
    RETURN NEW;
  END IF;

  IF next_row -> 'role' IS DISTINCT FROM previous_row -> 'role' THEN
    RAISE EXCEPTION 'Role changes require admin access';
  END IF;

  IF next_row -> 'is_suspended' IS DISTINCT FROM previous_row -> 'is_suspended' THEN
    RAISE EXCEPTION 'Suspension changes require admin access';
  END IF;

  IF next_row ->> 'suspension_reason' IS DISTINCT FROM previous_row ->> 'suspension_reason' THEN
    RAISE EXCEPTION 'Suspension metadata requires admin access';
  END IF;

  IF next_row ->> 'suspended_at' IS DISTINCT FROM previous_row ->> 'suspended_at' THEN
    RAISE EXCEPTION 'Suspension metadata requires admin access';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_users_privileged_fields() IS
'Blocks authenticated users from self-assigning admin or moderation state; service-role writes remain allowed.';

DROP TRIGGER IF EXISTS protect_users_privileged_fields ON public.users;

CREATE TRIGGER protect_users_privileged_fields
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_users_privileged_fields();
