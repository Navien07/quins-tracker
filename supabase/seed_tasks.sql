-- Seed per-phase tasks so the auto-% rollup has data from day one.
-- INTERNAL ONLY — tasks are never shown to the client. Safe to edit freely.
-- Run in the quins-tracker Supabase SQL Editor. Re-runnable: clears existing tasks first.

DELETE FROM tasks;

INSERT INTO tasks (phase_id, title, owner) VALUES
-- P2-01 Foundation (Day 2–7)
('P2-01', 'Sentiment scoring service skeleton', 'Navien'),
('P2-01', 'Text emotion classifier integration', 'Navien'),
('P2-01', 'Conversation ingestion pipeline', 'Navien'),
('P2-01', 'Emotion data model + storage schema', 'Navien'),
('P2-01', 'Unit tests + accuracy baseline report', 'Navien'),

-- P2-02 Analytics (Day 8–13)
('P2-02', 'Sentiment aggregation queries', 'Navien'),
('P2-02', 'Trend charts (daily/weekly mood)', 'Navien'),
('P2-02', 'Topic clustering on conversations', 'Navien'),
('P2-02', 'Analytics API endpoints', 'Navien'),
('P2-02', 'Dashboard data caching layer', 'Navien'),

-- P2-03 Dashboard (Day 14–19)
('P2-03', 'Command centre layout + nav', 'Avvie'),
('P2-03', 'Live case feed with emotion badges', 'Avvie'),
('P2-03', 'Alerting rules + thresholds UI', 'Avvie'),
('P2-03', 'Drill-down case detail view', 'Avvie'),
('P2-03', 'Responsive/mobile pass', 'Avvie'),

-- P2-04 Integrations (Day 20–24)
('P2-04', 'Voice channel connection (PBX/SIP)', 'Navien'),
('P2-04', 'WhatsApp assistant flow upgrade', 'Navien'),
('P2-04', 'Chatbot API handshake (Arvind docs)', 'Navien'),
('P2-04', 'End-to-end channel smoke tests', 'Navien'),

-- P2-05 UAT + Go-Live (Day 27–30)
('P2-05', 'UAT scripts + staff scheduling', 'Firdhaus'),
('P2-05', 'UAT round 1 + fixes', 'Firdhaus'),
('P2-05', 'UAT round 2 sign-off', 'Firdhaus'),
('P2-05', 'Production cutover + go-live checklist', 'Firdhaus'),

-- IL — ILMU Integration (Day 8–19, internal only)
('IL', 'Obtain ILMU API credentials (YTL)', 'Avvie'),
('IL', 'ILMU auth + request wrapper', 'Avvie'),
('IL', 'Response mapping into emotion pipeline', 'Avvie'),
('IL', 'Fallback + rate-limit handling', 'Avvie'),

-- EI-06 Annotation (Day 1–22)
('EI06', 'Annotation guidelines v1', 'Firdhaus'),
('EI06', 'Batch 1 labelling (500 samples)', 'Firdhaus'),
('EI06', 'Batch 2 labelling (500 samples)', 'Firdhaus'),
('EI06', 'Inter-annotator agreement check', 'Firdhaus'),
('EI06', 'Calibration report + handoff', 'Firdhaus'),

-- P2B — Phase 2b Acoustic Model (Day 20–26)
('P2B', 'Audio feature extraction pipeline', 'Navien'),
('P2B', 'Acoustic emotion model fine-tune', 'Navien'),
('P2B', 'Latency benchmark + optimisation', 'Navien'),
('P2B', 'Integration behind feature flag', 'Navien');
