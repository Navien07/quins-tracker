-- 002: per-workstream live build URL. The client can open and TEST the running
-- build (never the codebase). Set it from /internal as each preview goes live.
-- Run in the quins-tracker Supabase SQL Editor.

ALTER TABLE phases ADD COLUMN IF NOT EXISTS preview_url text;
