import * as geocodeService from '../services/geocodeService.js';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Search places by query string.
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim();
  const limit = Number(req.query.limit) || 6;

  if (!query) {
    res.json({ success: true, data: [] });
    return;
  }

  const data = await geocodeService.searchPlaces(query, limit);
  res.json({ success: true, data });
});

/**
 * Reverse geocode latitude and longitude to a location name.
 */
export const reverse = asyncHandler(async (req: Request, res: Response) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;

  if (!lat || !lng) {
    res.status(400).json({ success: false, error: 'Missing lat or lng' });
    return;
  }

  const data = await geocodeService.reverseGeocode(parseFloat(lat), parseFloat(lng));
  res.json({ success: true, data });
});
