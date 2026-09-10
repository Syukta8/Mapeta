/**
 * Business logic for incidents.
 */
import * as incidentModel from '../models/incidentModel.js';
import { broadcast } from '../ws/incidentSocket.js';
import type { Incident } from '../models/types.js';

/**
 * Gets all active incidents.
 * @returns Array of active incidents.
 */
export function getActiveIncidents(): Incident[] {
  return incidentModel.findActive(Date.now());
}

/**
 * Reports a new incident. Generates ID, computes expiry, persists, and broadcasts.
 * @param data - The incident data from the request body.
 * @returns The created incident.
 */
export function reportIncident(data: { id?: string; type: string; lat: number; lng: number; title?: string; description?: string; durationHours?: number }): Incident {
  const now = Date.now();
  const id = data.id || `inc_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const durationHours = data.durationHours || 2;
  const expiresAt = now + (durationHours * 3600 * 1000);

  const incident: Incident = {
    id,
    type: data.type as Incident['type'],
    lat: Number(data.lat),
    lng: Number(data.lng),
    title: data.title || `${data.type.toUpperCase()} reported`,
    description: data.description || '',
    reported_at: now,
    expires_at: expiresAt,
    upvotes: 1,
    downvotes: 0,
    active: 1
  };

  incidentModel.create(incident);

  broadcast({
    type: 'INCIDENT_NEW',
    payload: incident
  });

  return incident;
}

/**
 * Votes on an incident and applies auto-deactivation business rule.
 * Rule: if downvotes >= upvotes + 3, deactivate the incident.
 * @param id - The incident ID.
 * @param vote - 'up' or 'down'.
 * @returns The updated incident.
 */
export function voteIncident(id: string, vote: 'up' | 'down'): Incident {
  const incident = incidentModel.findById(id);
  if (!incident) {
    throw new Error(`Incident with id ${id} not found`);
  }

  let upvotes = incident.upvotes;
  let downvotes = incident.downvotes;
  let active = incident.active;

  if (vote === 'up') {
    upvotes += 1;
  } else if (vote === 'down') {
    downvotes += 1;
    if (downvotes >= upvotes + 3) {
      active = 0;
    }
  }

  incidentModel.updateVotesAndStatus(id, upvotes, downvotes, active);

  const updated = { ...incident, upvotes, downvotes, active };

  broadcast({
    type: active ? 'INCIDENT_UPDATE' : 'INCIDENT_DELETE',
    payload: updated
  });

  return updated;
}

/**
 * Purges expired incidents from the database.
 * @returns The number of purged incident records.
 */
export function purgeExpiredIncidents(): number {
  return incidentModel.deleteExpired(Date.now());
}
