import * as incidentService from '../services/incidentService.js';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Get all active incidents
 */
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const data = incidentService.getActiveIncidents();
  res.json({ success: true, data });
});

/**
 * Create a new incident
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { type, lat, lng } = req.body || {};
  if (!type || lat === undefined || lng === undefined) {
    res.status(400).json({ success: false, error: 'Missing required incident fields (type, lat, lng)' });
    return;
  }

  const data = incidentService.reportIncident(req.body);
  res.status(201).json({ success: true, data });
});

/**
 * Vote on an incident
 */
export const vote = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const data = incidentService.voteIncident(id, req.body.vote);
  res.json({ success: true, data });
});
