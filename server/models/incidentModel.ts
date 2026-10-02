import { getStatement } from '../db/database.js';
import { Incident } from './types.js';

/**
 * Finds all active incidents that have not expired.
 * @param now The current timestamp in milliseconds.
 * @returns Array of active incidents.
 */
export function findActive(now: number): Incident[] {
  const stmt = getStatement('SELECT * FROM incidents WHERE active = 1 AND expires_at > ? ORDER BY reported_at DESC');
  return stmt.all(now) as Incident[];
}

/**
 * Finds an incident by its ID.
 * @param id The ID of the incident.
 * @returns The incident if found, otherwise undefined.
 */
export function findById(id: string): Incident | undefined {
  const stmt = getStatement('SELECT * FROM incidents WHERE id = ?');
  return stmt.get(id) as Incident | undefined;
}

/**
 * Finds an incident by its client idempotency key.
 */
export function findByIdempotencyKey(key: string): Incident | undefined {
  const stmt = getStatement('SELECT * FROM incidents WHERE idempotency_key = ?');
  return stmt.get(key) as Incident | undefined;
}

/**
 * Creates a new incident in the database.
 * @param incident The incident to create.
 */
export function create(incident: Incident): void {
  const stmt = getStatement(`
    INSERT INTO incidents (
      id, type, subtype, lat, lng, accuracy, title, description, idempotency_key,
      reported_at, expires_at, upvotes, downvotes, status, active, reporter_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  stmt.run(
    incident.id,
    incident.type,
    incident.subtype || null,
    incident.lat,
    incident.lng,
    incident.accuracy ?? null,
    incident.title,
    incident.description || null,
    incident.idempotency_key || null,
    incident.reported_at,
    incident.expires_at,
    incident.upvotes ?? 1,
    incident.downvotes ?? 0,
    incident.status || 'active',
    incident.active ?? 1,
    incident.reporter_id || null
  );
}

/**
 * Updates the votes and active status of an incident.
 * @param id The ID of the incident.
 * @param upvotes The new upvotes count.
 * @param downvotes The new downvotes count.
 * @param active The new active status (1 or 0).
 */
export function updateVotesAndStatus(id: string, upvotes: number, downvotes: number, active: number): void {
  const stmt = getStatement('UPDATE incidents SET upvotes = ?, downvotes = ?, active = ? WHERE id = ?');
  stmt.run(upvotes, downvotes, active, id);
}

/**
 * Marks an incident as resolved by moderation or community action.
 */
export function resolve(id: string): void {
  const stmt = getStatement("UPDATE incidents SET status = 'resolved', active = 0 WHERE id = ?");
  stmt.run(id);
}

/**
 * Purges expired incidents from the database.
 * @param nowMs The cutoff timestamp in milliseconds.
 * @returns The number of rows deleted.
 */
export function deleteExpired(nowMs: number): number {
  const stmt = getStatement("UPDATE incidents SET status = 'expired', active = 0 WHERE active = 1 AND expires_at < ?");
  const info = stmt.run(nowMs);
  return info.changes;
}

