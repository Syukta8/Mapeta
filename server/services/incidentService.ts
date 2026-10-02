/**
 * Business logic for incidents.
 */
import * as incidentModel from '../models/incidentModel.js';
import { broadcast } from '../ws/incidentSocket.js';
import type { Incident } from '../models/types.js';

/**
 * Validates whether coordinates fall within Malaysian territory (Peninsular + Sabah/Sarawak).
 */
export function isWithinMalaysia(lat: number, lng: number): boolean {
  const inPeninsular = lat >= 1.0 && lat <= 7.5 && lng >= 99.5 && lng <= 105.0;
  const inBorneo = lat >= 0.8 && lat <= 7.5 && lng >= 109.0 && lng <= 119.5;
  return inPeninsular || inBorneo;
}

/**
 * Formats a button-driven display title without requiring user typing.
 */
function formatIncidentTitle(type: string, subtype?: string): string {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return subtype ? `${label}: ${subtype}` : `${label} reported`;
}

/**
 * Gets all active incidents.
 * @returns Array of active incidents.
 */
export function getActiveIncidents(): Incident[] {
  return incidentModel.findActive(Date.now());
}

/**
 * Reports a new incident. Validates Malaysia coverage, checks idempotency, generates ID, and broadcasts.
 * @param data - The incident data from the request body.
 * @returns The created (or deduplicated existing) incident.
 */
export function reportIncident(data: {
  id?: string;
  type: string;
  subtype?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  title?: string;
  description?: string;
  idempotency_key?: string;
  reporter_id?: string;
  durationHours?: number;
}): { incident: Incident; isDuplicate: boolean } {
  const lat = Number(data.lat);
  const lng = Number(data.lng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates: lat and lng must be valid numbers');
  }

  if (!isWithinMalaysia(lat, lng)) {
    throw new Error('Coordinates outside Malaysia coverage area (Peninsular, Sabah, Sarawak)');
  }

  // Idempotency deduplication check: if key already exists, return existing record
  if (data.idempotency_key) {
    const existing = incidentModel.findByIdempotencyKey(data.idempotency_key);
    if (existing) {
      return { incident: existing, isDuplicate: true };
    }
  }

  const now = Date.now();
  const id = data.id || `inc_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const durationHours = data.durationHours || 2;
  const expiresAt = now + durationHours * 3600 * 1000;

  const incident: Incident = {
    id,
    type: data.type as Incident['type'],
    subtype: data.subtype || undefined,
    lat,
    lng,
    accuracy: data.accuracy !== undefined ? Number(data.accuracy) : undefined,
    title: data.title || formatIncidentTitle(data.type, data.subtype),
    description: data.description || '',
    idempotency_key: data.idempotency_key || undefined,
    reported_at: now,
    expires_at: expiresAt,
    upvotes: 1,
    downvotes: 0,
    status: 'active',
    active: 1,
    reporter_id: data.reporter_id || null,
  };

  incidentModel.create(incident);

  broadcast({
    type: 'INCIDENT_NEW',
    payload: incident,
  });

  return { incident, isDuplicate: false };
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

  const updated: Incident = { ...incident, upvotes, downvotes, active };

  broadcast({
    type: active ? 'INCIDENT_UPDATE' : 'INCIDENT_DELETE',
    payload: updated,
  });

  return updated;
}

/**
 * Marks an incident as resolved by moderation or community action.
 */
export function resolveIncident(id: string): Incident {
  const incident = incidentModel.findById(id);
  if (!incident) {
    throw new Error(`Incident with id ${id} not found`);
  }

  incidentModel.resolve(id);
  const updated: Incident = { ...incident, status: 'resolved', active: 0 };

  broadcast({
    type: 'INCIDENT_DELETE',
    payload: updated,
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

