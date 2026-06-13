-- Add expanded social profile links.
-- twitter_url is intentionally retained for existing data; x_url is the active X/Twitter field.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS x_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS threads_url TEXT;

UPDATE public.users
SET x_url = twitter_url
WHERE (x_url IS NULL OR x_url = '')
  AND twitter_url IS NOT NULL
  AND twitter_url != '';

COMMENT ON COLUMN public.users.x_url IS 'X/Twitter profile URL. Replaces deprecated twitter_url.';
COMMENT ON COLUMN public.users.instagram_url IS 'Instagram profile URL.';
COMMENT ON COLUMN public.users.threads_url IS 'Threads profile URL.';
