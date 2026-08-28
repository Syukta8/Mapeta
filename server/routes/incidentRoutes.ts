import { Router } from 'express';
import { db } from '../db/database.js';
import { broadcast } from '../ws/incidentSocket.js';

export const incidentRouter = Router();

export interface Incident {
  id: string;
  type: 'police' | 'hazard' | 'jam' | 'closure' | 'accident';
  lat: number;
  lng: number;
  title: string;
  description?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  active: number;
}

// GET all active incidents
incidentRouter.get('/', (req, res) => {
  try {
    const now = Date.now();
    const rows = db.prepare(`
      SELECT * FROM incidents 
      WHERE active = 1 AND expires_at > ?
      ORDER BY reported_at DESC
    `).all(now) as Incident[];
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST a new incident report
incidentRouter.post('/', (req, res) => {
  try {
    const { id, type, lat, lng, title, description, durationHours = 2 } = req.body;
    if (!type || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required incident fields (type, lat, lng)' });
    }

    const incidentId = id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const expiresAt = now + (durationHours * 3600 * 1000);

    const incident: Incident = {
      id: incidentId,
      type,
      lat: Number(lat),
      lng: Number(lng),
      title: title || `${type.toUpperCase()} reported`,
      description: description || '',
      reported_at: now,
      expires_at: expiresAt,
      upvotes: 1,
      downvotes: 0,
      active: 1
    };

    db.prepare(`
      INSERT INTO incidents (id, type, lat, lng, title, description, reported_at, expires_at, upvotes, downvotes, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      incident.id,
      incident.type,
      incident.lat,
      incident.lng,
      incident.title,
      incident.description,
      incident.reported_at,
      incident.expires_at,
      incident.upvotes,
      incident.downvotes,
      incident.active
    );

    // Broadcast new incident to all connected clients immediately
    broadcast({
      type: 'INCIDENT_NEW',
      payload: incident
    });

    res.status(201).json({ success: true, data: incident });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST upvote or downvote an incident
incidentRouter.post('/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'

    const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id) as Incident | undefined;
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    let upvotes = incident.upvotes;
    let downvotes = incident.downvotes;
    let active = incident.active;

    if (vote === 'up') {
      upvotes += 1;
    } else if (vote === 'down') {
      downvotes += 1;
      // Auto-deactivate if net downvotes exceed threshold
      if (downvotes >= upvotes + 3) {
        active = 0;
      }
    }

    db.prepare('UPDATE incidents SET upvotes = ?, downvotes = ?, active = ? WHERE id = ?')
      .run(upvotes, downvotes, active, id);

    const updated = { ...incident, upvotes, downvotes, active };

    broadcast({
      type: active ? 'INCIDENT_UPDATE' : 'INCIDENT_DELETE',
      payload: updated
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
