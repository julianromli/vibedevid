-- Add missing foreign key constraints after UUID to integer migration

-- Add foreign key constraint between projects.author_id and users.id
ALTER TABLE projects 
ADD CONSTRAINT projects_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraint between comments.project_id and projects.id
ALTER TABLE comments 
ADD CONSTRAINT comments_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraint between comments.user_id and users.id
ALTER TABLE comments 
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraint between likes.project_id and projects.id
ALTER TABLE likes 
ADD CONSTRAINT likes_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraint between likes.user_id and users.id
ALTER TABLE likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraint between views.project_id and projects.id
ALTER TABLE views 
ADD CONSTRAINT views_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add foreign key constraint between views.user_id and users.id
ALTER TABLE views 
ADD CONSTRAINT views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
