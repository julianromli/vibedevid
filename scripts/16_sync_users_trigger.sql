-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  base_username text;
  counter integer := 0;
BEGIN
  -- Generate base username from metadata or email or ID
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- Clean username (keep only alphanumeric)
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g');
  
  -- Ensure non-empty and minimum length
  IF length(base_username) < 3 THEN
     base_username := 'user_' || substr(new.id::text, 1, 8);
  END IF;

  new_username := base_username;
  
  -- Check for collisions and increment
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter;
  END LOOP;

  INSERT INTO public.users (id, username, display_name, avatar_url, updated_at)
  VALUES (
    new.id,
    new_username,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new_username),
    COALESCE(new.raw_user_meta_data->>'avatar_url', null),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    -- Optional: update other fields if they are missing or you want to sync
    display_name = EXCLUDED.display_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill missing users
INSERT INTO public.users (id, username, display_name, avatar_url, updated_at)
SELECT 
  au.id, 
  -- valid username generation for backfill: email prefix + short ID to minimize collision
  regexp_replace(split_part(au.email, '@', 1), '[^a-zA-Z0-9]', '', 'g') || '_' || substr(au.id::text, 1, 4),
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'avatar_url', null),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
