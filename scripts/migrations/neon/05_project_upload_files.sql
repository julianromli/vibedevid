-- Ledger of project screenshots uploaded through UploadThing.
-- A key may be saved or deleted only when this row matches the signed-in user.
-- Idempotent. Apply with `bun run migrate:schema`.

CREATE TABLE IF NOT EXISTS project_upload_files (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  project_id INTEGER REFERENCES projects (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_upload_files_user_id
  ON project_upload_files (user_id);

CREATE INDEX IF NOT EXISTS idx_project_upload_files_project_id
  ON project_upload_files (project_id);
