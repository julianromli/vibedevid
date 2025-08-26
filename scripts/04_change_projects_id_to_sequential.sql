-- Migration: Change projects.id from UUID to sequential integer
-- This will change the project ID system from UUID to sequential numbers (1, 2, 3, etc.)

-- Step 1: Drop existing foreign key constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_project_id_fkey;
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_project_id_fkey;
ALTER TABLE views DROP CONSTRAINT IF EXISTS views_project_id_fkey;

-- Step 2: Create a mapping table to track old UUID to new integer ID
CREATE TEMPORARY TABLE project_id_mapping (
    old_uuid UUID,
    new_id INTEGER
);

-- Step 3: Create new projects table with integer ID
CREATE TABLE projects_new (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    website_url TEXT,
    image_url TEXT,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Copy data and create mapping
INSERT INTO projects_new (title, description, category, website_url, image_url, author_id, created_at, updated_at)
SELECT title, description, category, website_url, image_url, author_id, created_at, updated_at
FROM projects
ORDER BY created_at;

-- Create the mapping between old UUIDs and new integer IDs
INSERT INTO project_id_mapping (old_uuid, new_id)
SELECT p.id, pn.id
FROM projects p
JOIN projects_new pn ON p.title = pn.title AND p.created_at = pn.created_at;

-- Step 5: Update related tables to use integer project_id
-- Update comments table
ALTER TABLE comments ADD COLUMN project_id_new INTEGER;
UPDATE comments 
SET project_id_new = pim.new_id
FROM project_id_mapping pim
WHERE comments.project_id = pim.old_uuid;

-- Update likes table
ALTER TABLE likes ADD COLUMN project_id_new INTEGER;
UPDATE likes
SET project_id_new = pim.new_id
FROM project_id_mapping pim
WHERE likes.project_id = pim.old_uuid;

-- Update views table
ALTER TABLE views ADD COLUMN project_id_new INTEGER;
UPDATE views
SET project_id_new = pim.new_id
FROM project_id_mapping pim
WHERE views.project_id = pim.old_uuid;

-- Step 6: Drop old columns and rename new ones
ALTER TABLE comments DROP COLUMN project_id;
ALTER TABLE comments RENAME COLUMN project_id_new TO project_id;

ALTER TABLE likes DROP COLUMN project_id;
ALTER TABLE likes RENAME COLUMN project_id_new TO project_id;

ALTER TABLE views DROP COLUMN project_id;
ALTER TABLE views RENAME COLUMN project_id_new TO project_id;

-- Step 7: Replace old projects table
DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

-- Step 8: Add foreign key constraints back
ALTER TABLE comments ADD CONSTRAINT comments_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE likes ADD CONSTRAINT likes_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE views ADD CONSTRAINT views_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Step 9: Recreate indexes
CREATE INDEX idx_projects_author_id ON projects(author_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_likes_project_id ON likes(project_id);
CREATE INDEX idx_views_project_id ON views(project_id);

-- Step 10: Enable RLS and recreate policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = author_id);

-- Clean up
DROP TABLE project_id_mapping;
