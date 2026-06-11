-- 001: progress snapshots for the burndown / progress-over-time chart.
-- Run in the quins-tracker Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS progress_snapshots (
  snap_date  date PRIMARY KEY,              -- one row per day (upserted)
  overall    int NOT NULL CHECK (overall BETWEEN 0 AND 100),
  delivered  int NOT NULL DEFAULT 0,
  total      int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_snapshots" ON progress_snapshots FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_snapshots" ON progress_snapshots FOR ALL    USING (auth.role() = 'service_role');
