-- Migration 001: Initial reporting and favorites schema with idempotency and accuracy

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  accuracy REAL,
  title TEXT NOT NULL,
  description TEXT,
  idempotency_key TEXT UNIQUE,
  reported_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  upvotes INTEGER DEFAULT 1,
  downvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  active INTEGER DEFAULT 1,
  reporter_id TEXT
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_active ON incidents(active, expires_at);
CREATE INDEX IF NOT EXISTS idx_incidents_idempotency ON incidents(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
