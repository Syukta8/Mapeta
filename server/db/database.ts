import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'mapeta.sqlite');
export const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subtype TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reported_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
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
    CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
  `);

  console.log('[Database] SQLite initialized with incidents and favorites tables at:', dbPath);
}
