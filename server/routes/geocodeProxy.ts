import { Router } from 'express';
import { db } from '../db/database.js';

export const geocodeRouter = Router();

const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// GET /api/geocode/search?q=address&limit=5
geocodeRouter.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    const limit = Number(req.query.limit) || 5;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const localMatches = db.prepare(`
      SELECT id, name, category, lat, lng, address as display_name 
      FROM local_pois 
      WHERE name LIKE ? OR address LIKE ?
      LIMIT ?
    `).all(`%${query}%`, `%${query}%`, limit);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
        'Accept-Language': 'en',
      },
    });

    let externalResults: any[] = [];
    if (response.ok) {
      externalResults = await response.json();
    }

    const combined = [...localMatches, ...externalResults].slice(0, limit);
    searchCache.set(query.toLowerCase(), { data: combined, timestamp: Date.now() });

    res.json({ success: true, data: combined });
  } catch (err: any) {
    console.error('[GeocodeProxy] Search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/geocode/reverse?lat=x&lng=y
geocodeRouter.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[GeocodeProxy] Reverse geocode error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
