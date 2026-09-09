/**
 * Test Database Helper
 * Provides an in-memory SQLite database instance for test isolation.
 */

import './setupEnv.js';
import { db, initDatabase } from '../../db/database.js';

/**
 * Initializes the in-memory test database schema and indexes.
 */
export function setupTestDb(): void {
  if (!db.memory && db.name !== ':memory:') {
    throw new Error(`[Database Safety] Safety guard triggered: test database is not in-memory (${db.name})`);
  }
  initDatabase();
}

/**
 * Clears all rows from the test database tables to ensure test isolation.
 */
export function clearTestDb(): void {
  if (!db.memory && db.name !== ':memory:') {
    throw new Error(`[Database Safety] Safety guard triggered: test database is not in-memory (${db.name})`);
  }
  db.exec('DELETE FROM incidents; DELETE FROM favorites;');
}

export { db, initDatabase };
