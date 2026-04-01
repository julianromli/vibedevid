-- Add multi-image support for projects
-- Add image_urls TEXT[] (array of URLs) and image_keys TEXT[] (array of UploadThing keys)

-- Step 1: Add new columns as nullable first
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_keys TEXT[];

-- Step 2: Migrate existing image_url data to image_urls (single-item array)
UPDATE public.projects
SET
  image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL AND image_url != '';

-- Step 3: Add NOT NULL constraint after migration (optional - can be relaxed if needed)
-- For now, keep them nullable to allow projects with no images

-- Step 4: Create index for faster array queries (if needed)
-- CREATE INDEX IF NOT EXISTS idx_projects_image_urls ON public.projects USING GIN (image_urls);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.projects.image_urls IS 'Array of project screenshot URLs';
COMMENT ON COLUMN public.projects.image_keys IS 'Array of UploadThing file keys for cleanup';
