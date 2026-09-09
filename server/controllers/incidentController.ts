import * as incidentService from '../services/incidentService.js';
import type { Request, Response } from 'express';

/**
 * Get all active incidents
 */
export const getAll = (_req: Request, res: Response) => {
  try {
    const data = incidentService.getActiveIncidents();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Create a new incident
 */
export const create = (req: Request, res: Response) => {
  try {
    const { type, lat, lng } = req.body || {};
    if (!type || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required incident fields (type, lat, lng)' });
    }

    const data = incidentService.reportIncident(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Vote on an incident
 */
export const vote = (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const data = incidentService.voteIncident(id, req.body.vote);
    res.json({ success: true, data });
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};
