-- CollabSphere schema. JSON-ish fields (approvals, rsvps, checked_in, houses,
-- skills) are stored as TEXT and parsed by src/db/mappers.js.

CREATE TABLE IF NOT EXISTS users (
  roll_no       TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  house         TEXT NOT NULL,
  xp            INTEGER NOT NULL DEFAULT 0,
  password_salt TEXT,
  password_hash TEXT,
  password_iters INTEGER,
  is_secretary  INTEGER NOT NULL DEFAULT 0
);

-- Server-issued member sessions (opaque random tokens; the client never sees a password).
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  roll_no    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Server-issued secretary (admin) sessions, scoped to one house.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token      TEXT PRIMARY KEY,
  house      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Per-house admin credentials. Only a PBKDF2 verifier is stored, never the password.
CREATE TABLE IF NOT EXISTS house_admins (
  house TEXT PRIMARY KEY,
  salt  TEXT NOT NULL,
  hash  TEXT NOT NULL,
  iters INTEGER NOT NULL,
  algo  TEXT NOT NULL DEFAULT 'pbkdf2-sha256'
);

CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL,
  city           TEXT NOT NULL,
  venue          TEXT NOT NULL,
  lat            REAL NOT NULL,
  lng            REAL NOT NULL,
  date           TEXT NOT NULL,
  primary_house  TEXT NOT NULL,
  co_host_house  TEXT,
  society        TEXT,
  xp_reward      INTEGER NOT NULL DEFAULT 50,
  status         TEXT NOT NULL,
  approvals      TEXT NOT NULL DEFAULT '{}',
  rsvps          TEXT NOT NULL DEFAULT '[]',
  checked_in     TEXT NOT NULL DEFAULT '[]',
  reject_reason  TEXT,
  cancel_reason  TEXT
);

-- One row per verified check-in. The UNIQUE pair makes XP idempotent per event.
CREATE TABLE IF NOT EXISTS ledger (
  idx          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  roll_no      TEXT NOT NULL,
  xp           INTEGER NOT NULL,
  houses       TEXT NOT NULL,
  photo_hash   TEXT NOT NULL,
  distance_m   REAL NOT NULL,
  name         TEXT NOT NULL,
  event_title  TEXT NOT NULL,
  society      TEXT,
  prev_hash    TEXT NOT NULL,
  hash         TEXT NOT NULL,
  UNIQUE (event_id, roll_no)
);

CREATE TABLE IF NOT EXISTS house_xp (
  house TEXT PRIMARY KEY,
  xp    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS society_xp (
  society TEXT PRIMARY KEY,
  xp      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS announcements (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  audience     TEXT NOT NULL,
  pinned       INTEGER NOT NULL DEFAULT 0,
  author_house TEXT NOT NULL,
  author       TEXT NOT NULL,
  ts           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id    TEXT PRIMARY KEY,
  ts    TEXT NOT NULL,
  kind  TEXT NOT NULL,
  text  TEXT NOT NULL,
  by    TEXT NOT NULL,
  house TEXT
);

CREATE TABLE IF NOT EXISTS peers (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  house  TEXT NOT NULL,
  level  TEXT,
  city   TEXT,
  lat    REAL NOT NULL,
  lng    REAL NOT NULL,
  status TEXT,
  skills TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS pings (
  peer_id TEXT PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity (ts);
CREATE INDEX IF NOT EXISTS idx_ledger_roll ON ledger (roll_no);
