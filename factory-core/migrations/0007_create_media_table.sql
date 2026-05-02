-- Migration: Create media table for multi-tenant CMS uploads (R2-backed)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  renter_id TEXT NOT NULL REFERENCES renters(id),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS media_project_idx ON media(project_id);
CREATE INDEX IF NOT EXISTS media_renter_idx ON media(renter_id);
