import { Router } from 'express';

export const routeRouter = Router();

// GET /api/route?start=lng,lat&end=lng,lat&profile=driving|bike|foot&alternatives=true&avoidTolls=true
routeRouter.get('/', async (req, res) => {
  try {
    const { start, end, profile = 'driving', alternatives = 'true', avoidTolls = 'false' } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Start and end coordinates required (format: lng,lat)' });
    }

    const mode = profile === 'bike' ? 'bike' : profile === 'foot' ? 'foot' : 'driving';
    let excludeParam = '';
    if (avoidTolls === 'true' && mode === 'driving') {
      excludeParam = '&exclude=toll';
    }

    const osrmUrl = `https://routing.openstreetmap.de/routed-${mode}/route/v1/${mode}/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=${alternatives}${excludeParam}`;

    const response = await fetch(osrmUrl, {
      headers: {
        'User-Agent': 'Mapeta-Local-Server/1.0',
      },
    });

    if (!response.ok) {
      const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives}${excludeParam}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' },
      });
      if (!fallbackRes.ok) {
        throw new Error(`OSRM routing failed with status ${fallbackRes.status}`);
      }
      const data = await fallbackRes.json();
      return res.json({ success: true, data });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[RouteProxy] Routing error:', err);
    res.status(500).json({ success: false, error: err.message || 'Routing calculation failed' });
  }
});
