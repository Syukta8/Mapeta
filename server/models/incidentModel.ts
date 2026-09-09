import { db } from '../db/database.js';
import { Incident } from './types.js';

/**
 * Finds all active incidents that have not expired.
 * @param now The current timestamp in milliseconds.
 * @returns Array of active incidents.
 */
export function findActive(now: number): Incident[] {
  const stmt = db.prepare('SELECT * FROM incidents WHERE active = 1 AND expires_at > ? ORDER BY reported_at DESC');
  return stmt.all(now) as Incident[];
}

/**
 * Finds an incident by its ID.
 * @param id The ID of the incident.
 * @returns The incident if found, otherwise undefined.
 */
export function findById(id: string): Incident | undefined {
  const stmt = db.prepare('SELECT * FROM incidents WHERE id = ?');
  return stmt.get(id) as Incident | undefined;
}

/**
 * Creates a new incident in the database.
 * @param incident The incident to create.
 */
export function create(incident: Incident): void {
  const stmt = db.prepare(`
    INSERT INTO incidents (
      id, type, lat, lng, title, description, reported_at, expires_at, upvotes, downvotes, active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  stmt.run(
    incident.id,
    incident.type,
    incident.lat,
    incident.lng,
    incident.title,
    incident.description || null,
    incident.reported_at,
    incident.expires_at,
    incident.upvotes,
    incident.downvotes,
    incident.active
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
  const stmt = db.prepare('UPDATE incidents SET upvotes = ?, downvotes = ?, active = ? WHERE id = ?');
  stmt.run(upvotes, downvotes, active, id);
}
