-- quins-tracker schema + 30-day plan seed.
-- Run this in the quins-tracker Supabase project SQL Editor.

-- PHASES (swimlanes)
CREATE TABLE phases (
  id              text PRIMARY KEY,           -- internal id e.g. 'P2-01'
  internal_name   text NOT NULL,              -- 'P2-01 Foundation'
  client_name     text,                       -- 'Emotional Intelligence Engine — Foundation' (null = never show client)
  client_visible  boolean NOT NULL DEFAULT false,
  track           text NOT NULL,              -- 'core' | 'parallel_a' | 'parallel_b' | 'parallel_c'
  start_day       int NOT NULL,               -- day index 1..30
  end_day         int NOT NULL,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  ship_tag        text,                       -- git tag that marks Delivered e.g. 'p2-01-complete'
  status          text NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','delivered','blocked')),
  percent         int NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  owner           text,                       -- internal only
  sort_order      int NOT NULL DEFAULT 0,
  updated_at      timestamptz DEFAULT now()
);

-- TASKS (internal granularity, never shown to client)
CREATE TABLE tasks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id    text NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title       text NOT NULL,
  owner       text,
  done        boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ACTIVITY (raw GitHub events — internal only; client feed is derived/translated)
CREATE TABLE activity (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id    text REFERENCES phases(id) ON DELETE SET NULL,
  kind        text NOT NULL,                  -- 'tag' | 'pr_merged' | 'push'
  raw_message text NOT NULL,                  -- raw commit/PR title — INTERNAL ONLY
  client_label text,                          -- translated, safe-to-show summary (nullable)
  sha         text,
  url         text,
  occurred_at timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- BLOCKERS (internal only)
CREATE TABLE blockers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label       text NOT NULL,
  owner       text NOT NULL,
  needed_by   text,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at  timestamptz DEFAULT now()
);

-- SYNC LOG
CREATE TABLE sync_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source      text NOT NULL,                  -- 'webhook' | 'manual_resync'
  detail      text,
  synced_at   timestamptz DEFAULT now()
);

ALTER TABLE phases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Internal reads: any authenticated user. Service role does all writes.
CREATE POLICY "auth_read_phases"   ON phases   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_phases"   ON phases   FOR ALL    USING (auth.role() = 'service_role');
CREATE POLICY "auth_read_tasks"    ON tasks    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_tasks"    ON tasks    FOR ALL    USING (auth.role() = 'service_role');
CREATE POLICY "auth_read_activity" ON activity FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_activity" ON activity FOR ALL    USING (auth.role() = 'service_role');
CREATE POLICY "auth_read_blockers" ON blockers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_blockers" ON blockers FOR ALL    USING (auth.role() = 'service_role');
CREATE POLICY "auth_read_synclog"  ON sync_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "svc_write_synclog"  ON sync_log FOR ALL    USING (auth.role() = 'service_role');

-- NOTE: the client view does NOT use a Supabase session. It is served by a
-- server route that uses the SERVICE ROLE key after validating the share token,
-- and returns ONLY translated fields. RLS is not the client gate — token is.

-- ─── SEED: 30-day plan (8 Jun → 7 Jul 2026) ───────────────────────────────
INSERT INTO phases (id, internal_name, client_name, client_visible, track, start_day, end_day, start_date, end_date, ship_tag, owner, sort_order) VALUES
('P2-00','P2-00 Project Tracker',           NULL,                                              false,'core',1, 1, '2026-06-08','2026-06-08','tracker-live',     'Navien', 0),
('P2-01','P2-01 Foundation',                'Emotional Intelligence Engine — Foundation',      true, 'core',2, 7, '2026-06-09','2026-06-14','p2-01-complete',   'Navien', 1),
('P2-02','P2-02 Analytics',                 'Dashboard Analytics & Sentiment',                 true, 'core',8, 13,'2026-06-15','2026-06-20','p2-02-complete',   'Navien', 2),
('P2-03','P2-03 Dashboard',                 'Command Centre Dashboard V2',                     true, 'core',14,19,'2026-06-21','2026-06-26','p2-03-complete',   'Avvie',  3),
('P2-04','P2-04 Integrations',              'Voice & WhatsApp Assistant V2',                   true, 'core',20,24,'2026-06-27','2026-07-01','p2-04-complete',   'Navien', 4),
('P2-05','P2-05 UAT + Go-Live',             'Testing & Go-Live',                               true, 'core',27,30,'2026-07-04','2026-07-07','v2.0.0',           'Firdhaus',5),
('IL',   'P2-02.5 ILMU Integration',        NULL,                                              false,'parallel_a',8,19,'2026-06-15','2026-06-26','p2-02.5-complete','Avvie', 6),
('EI06', 'EI-06 Annotation',                'Model Calibration & Quality Assurance',           true, 'parallel_b',1,22,'2026-06-08','2026-06-29',NULL,             'Firdhaus',7),
('P2B',  'Phase 2b Acoustic Model',         'Advanced Voice Emotion Model',                    true, 'parallel_c',20,26,'2026-06-27','2026-07-03',NULL,            'Navien', 8);

INSERT INTO blockers (label, owner, needed_by, status) VALUES
('PDPA audio consent', 'Firdhaus', 'Week 1', 'resolved'),
('ILMU API credentials from YTL', 'Avvie', 'Day 8', 'open'),
('Arvind chatbot API docs', 'Qube Media', 'Before P2-04', 'open'),
('MyKasih IT PBX/SIP config', 'MyKasih IT', 'Before P2-04', 'open'),
('2 half-days MyKasih staff for UAT', 'MyKasih Foundation', 'Day 27-28', 'open');
