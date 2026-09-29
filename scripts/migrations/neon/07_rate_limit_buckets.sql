-- Fixed-window counters for guest comments and the GitHub import route.
-- If this table is missing, the app falls back to an in-memory limit
-- inside the current Worker isolate (weaker, but the routes stay up).
-- Idempotent. Apply with `bun run migrate:schema`.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start TIMESTAMPTZ NOT NULL
);
