import type Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_reporting',
    sql: `
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
    `,
  },
];

const migrationStmtCache = new Map<string, Database.Statement>();

function getMigrationStmt(db: Database.Database, sql: string): Database.Statement {
  let stmt = migrationStmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    migrationStmtCache.set(sql, stmt);
  }
  return stmt;
}

/**
 * Runs pending database migrations in a single transaction.
 */
export function runMigrations(db: Database.Database): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const selectStmt = getMigrationStmt(db, 'SELECT version FROM schema_migrations');
  const appliedRows = selectStmt.all() as { version: number }[];
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  let appliedCount = 0;
  const insertMigration = getMigrationStmt(db, 'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)');

  for (const m of MIGRATIONS) {
    if (!appliedSet.has(m.version)) {
      const applyTx = db.transaction(() => {
        db.exec(m.sql);
        insertMigration.run(m.version, m.name, Date.now());
      });
      applyTx();
      appliedCount++;
    }
  }

  return appliedCount;
}
