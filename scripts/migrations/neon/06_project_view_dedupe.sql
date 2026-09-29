-- One project view per browser session per calendar day.
-- recordProjectView treats a unique violation as "already counted".
-- Idempotent. Apply with `bun run migrate:schema`.

CREATE UNIQUE INDEX IF NOT EXISTS views_project_session_day_uidx
  ON views (project_id, session_id, view_date)
  WHERE project_id IS NOT NULL AND session_id IS NOT NULL;
