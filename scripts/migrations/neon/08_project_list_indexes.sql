-- List pages order by created_at and filter by category.
-- Idempotent. Apply with `bun run migrate:schema`.

CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON projects (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_category_created_at
  ON projects (category, created_at DESC);
