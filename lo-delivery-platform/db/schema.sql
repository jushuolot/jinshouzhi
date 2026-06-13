-- LO Delivery Platform — SQLite schema (mirrors web/docs demo data model)
-- Apply: sqlite3 path/to/your.db < db/schema.sql

PRAGMA foreign_keys = ON;

-- Logistics orders (LO): core row + JSON blobs for UI bars, per-stage notes, ops side lines
CREATE TABLE IF NOT EXISTS lo_orders (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  risk TEXT NOT NULL,
  priority TEXT NOT NULL,
  demand INTEGER,
  sat INTEGER,
  next_text TEXT,
  eta_text TEXT,
  level TEXT,
  chain_lane TEXT NOT NULL,
  chain_current INTEGER NOT NULL,
  chain_blocked INTEGER,
  bars_json TEXT NOT NULL,
  chain_notes_json TEXT,
  side_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lo_orders_channel ON lo_orders (channel);
CREATE INDEX IF NOT EXISTS idx_lo_orders_status ON lo_orders (status);
CREATE INDEX IF NOT EXISTS idx_lo_orders_risk ON lo_orders (risk);

-- Event ledger / timeline rows (maps to los[].timeline: t, e, c)
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lo_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  time_label TEXT NOT NULL,
  event_code TEXT NOT NULL,
  category TEXT NOT NULL,
  FOREIGN KEY (lo_id) REFERENCES lo_orders (id) ON DELETE CASCADE,
  UNIQUE (lo_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_order_events_lo ON order_events (lo_id);

-- Ecosystem role cards (maps to ECOSYSTEM: id, name, short, hint, c1, c2)
CREATE TABLE IF NOT EXISTS ecosystem_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short TEXT NOT NULL,
  hint TEXT NOT NULL,
  color_1 TEXT NOT NULL,
  color_2 TEXT NOT NULL
);

-- Reference chain stages (maps to ORDER_CHAIN_STAGES)
CREATE TABLE IF NOT EXISTS chain_stage_definitions (
  sort_order INTEGER NOT NULL UNIQUE,
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  gate TEXT NOT NULL,
  checklist_json TEXT NOT NULL,
  secondary_role_keys_json TEXT,
  FOREIGN KEY (role_key) REFERENCES ecosystem_roles (id)
);

CREATE INDEX IF NOT EXISTS idx_chain_stage_role ON chain_stage_definitions (role_key);

-- Per-user default role for future API / multi-tenant views
CREATE TABLE IF NOT EXISTS user_view_role (
  user_id TEXT PRIMARY KEY,
  role_key TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_key) REFERENCES ecosystem_roles (id)
);

-- Optional singleton: mirrors in-memory econ bar in the demo (cash, rep, morale, queue, autorecon)
CREATE TABLE IF NOT EXISTS sim_econ_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cash_yuan INTEGER NOT NULL,
  rep INTEGER NOT NULL,
  morale INTEGER NOT NULL,
  queue INTEGER NOT NULL,
  autorecon_pct INTEGER NOT NULL,
  sim_day INTEGER NOT NULL,
  sim_minutes INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Daily goal templates (maps to renderGoals() structure; progress stays client-side until API exists)
CREATE TABLE IF NOT EXISTS daily_goal_templates (
  sort_order INTEGER PRIMARY KEY,
  meta TEXT NOT NULL,
  title TEXT NOT NULL,
  max_progress INTEGER NOT NULL,
  sub TEXT NOT NULL
);
