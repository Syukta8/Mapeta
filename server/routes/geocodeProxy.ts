import { Router } from 'express';
import { db } from '../db/database.js';

export const geocodeRouter = Router();

const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// GET /api/geocode/search?q=address&limit=6
geocodeRouter.get('/search', async (req, res) => {
  try {
    const query = ((req.query.q as string) || '').trim();
    const limit = Number(req.query.limit) || 6;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // 1. Check local saved favorites first
    let localMatches: any[] = [];
    try {
      localMatches = db.prepare(`
        SELECT id, name, type as category, lat, lng, address as display_name 
        FROM favorites 
        WHERE name LIKE ? OR address LIKE ?
        LIMIT 3
      `).all(`%${query}%`, `%${query}%`);
    } catch (e) {
      localMatches = [];
    }

    // 2. Query Photon / Nominatim OpenStreetMap Geocoder
    let externalResults: any[] = [];
    try {
      // Primary fast geocoder: Photon (Komoot OpenStreetMap vector index)
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}&lat=3.1390&lon=101.6869`;
      const photonRes = await fetch(photonUrl, {
        headers: { 'User-Agent': 'Mapeta-GPS/1.0' },
      });

      if (photonRes.ok) {
        const photonJson: any = await photonRes.json();
        if (photonJson.features && Array.isArray(photonJson.features)) {
          externalResults = photonJson.features.map((f: any) => {
            const p = f.properties || {};
            const name = p.name || p.street || p.city || query;
            const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
            const displayName = parts.join(', ');
            return {
              id: `osm-${p.osm_id || Math.random()}`,
              name,
              display_name: displayName || name,
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              lng: f.geometry.coordinates[0],
              category: p.osm_value || 'place',
            };
          });
        }
      }
    } catch (e) {
      // Fallback to Nominatim if Photon fails
    }

    if (externalResults.length === 0) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}&countrycodes=my,sg,id,th`;
        const nomRes = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'Mapeta-GPS-Local/1.0',
            'Accept-Language': 'en',
          },
        });
        if (nomRes.ok) {
          externalResults = await nomRes.json();
        }
      } catch (e) {
        console.error('[GeocodeProxy] Nominatim fallback error:', e);
      }
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

    // Fast Reverse Geocoding via Photon / Nominatim
    try {
      const photonRevUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
      const revRes = await fetch(photonRevUrl, { headers: { 'User-Agent': 'Mapeta-GPS/1.0' } });
      if (revRes.ok) {
        const revJson: any = await revRes.json();
        if (revJson.features && revJson.features[0]) {
          const p = revJson.features[0].properties || {};
          const name = p.name || p.street || 'Selected Location';
          const parts = [p.name, p.street, p.district, p.city, p.state].filter(Boolean);
          return res.json({
            success: true,
            data: {
              name,
              display_name: parts.join(', ') || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
              lat: Number(lat),
              lng: Number(lng),
            },
          });
        }
      }
    } catch (e) {}

    // Fallback to Nominatim Reverse
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Mapeta-GPS-Local/1.0',
        'Accept-Language': 'en',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        data: {
          name: data.name || data.display_name?.split(',')[0] || 'Selected Location',
          display_name: data.display_name || `${lat}, ${lng}`,
          lat: Number(lat),
          lng: Number(lng),
        },
      });
    }

    res.json({
      success: true,
      data: {
        name: 'Selected Location',
        display_name: `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`,
        lat: Number(lat),
        lng: Number(lng),
      },
    });
  } catch (err: any) {
    console.error('[GeocodeProxy] Reverse geocode error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
