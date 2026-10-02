import Database from 'better-sqlite3';
import path from 'path';
import { runMigrations } from './migrate.js';

const dbPath = process.env.MAPETA_DB_PATH || path.join(process.cwd(), 'mapeta.sqlite');
export const db = new Database(dbPath);
if (dbPath !== ':memory:') {
  db.pragma('journal_mode = WAL');
}

const stmtCache = new Map<string, Database.Statement>();

/**
 * Retrieves or creates a cached prepared statement to avoid repetitive compilation
 * and prevent temporary statement GC destructor issues in Node 24.
 */
export function getStatement(sql: string): Database.Statement {
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
}

export function initDatabase() {
  const count = runMigrations(db);
  console.log(`[Database] SQLite initialized at ${dbPath}. Applied ${count} migration(s).`);
}
