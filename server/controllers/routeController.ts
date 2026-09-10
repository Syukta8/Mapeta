import * as routeService from '../services/routeService.js';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Calculate route
 */
export const getRoute = asyncHandler(async (req: Request, res: Response) => {
  const start = req.query.start as string;
  const end = req.query.end as string;
  const profile = (req.query.profile as string) || 'driving';

  if (!start || !end) {
    res.status(400).json({ success: false, error: 'Missing start or end coordinates' });
    return;
  }

  const data = await routeService.calculateRoutes(start, end, profile);
  res.json({ success: true, data });
});
