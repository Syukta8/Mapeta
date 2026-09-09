import * as geocodeService from '../services/geocodeService.js';
import type { Request, Response } from 'express';

/**
 * Search places by query string.
 */
export const search = async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    const limit = Number(req.query.limit) || 6;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const data = await geocodeService.searchPlaces(query, limit);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Reverse geocode latitude and longitude to a location name.
 */
export const reverse = async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Missing lat or lng' });
    }

    const data = await geocodeService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
