import { Router } from 'express';

export const routeRouter = Router();

// GET /api/route?start=lng,lat&end=lng,lat&profile=driving|bike|foot
routeRouter.get('/', async (req, res) => {
  try {
    const { start, end, profile = 'driving' } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Start and end coordinates required (format: lng,lat)' });
    }

    const [startLng, startLat] = (start as string).split(',').map(Number);
    const [endLng, endLat] = (end as string).split(',').map(Number);
    const mode = profile === 'bike' ? 'bike' : profile === 'foot' ? 'foot' : 'driving';

    if (mode !== 'driving') {
      const url = `https://routing.openstreetmap.de/routed-${mode}/route/v1/${mode}/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=3`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
      const data = await response.json();
      return res.json({ success: true, data });
    }

    // Driving Mode: Multi-Detour & Multi-Engine Parallel Harvesting
    // 1. Direct Highway Query with alternatives=3
    const directUrl = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=3`;
    const fallbackDirectUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=3`;

    // 2. Compute 2 Smart Midpoint Detour Waypoints (Left/Coastal offset & Right/Inland offset)
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    const dLng = endLng - startLng;
    const dLat = endLat - startLat;
    const distFactor = Math.min(0.25, Math.sqrt(dLng * dLng + dLat * dLat) * 0.22);

    // Perpendicular vector (-dLat, dLng)
    const p1Lng = Number((midLng - dLat * distFactor).toFixed(5));
    const p1Lat = Number((midLat + dLng * distFactor).toFixed(5));
    const p2Lng = Number((midLng + dLat * distFactor).toFixed(5));
    const p2Lat = Number((midLat - dLng * distFactor).toFixed(5));

    const detourUrl1 = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${p1Lng},${p1Lat};${end}?overview=full&geometries=geojson&steps=true&annotations=true`;
    const detourUrl2 = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${p2Lng},${p2Lat};${end}?overview=full&geometries=geojson&steps=true&annotations=true`;

    const [rDirect, rFallback, rDetour1, rDetour2] = await Promise.allSettled([
      fetch(directUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()),
      fetch(fallbackDirectUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()),
      fetch(detourUrl1, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()),
      fetch(detourUrl2, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()),
    ]);

    const collectedRoutes: any[] = [];

    if (rDirect.status === 'fulfilled' && rDirect.value.routes) {
      collectedRoutes.push(...rDirect.value.routes);
    }
    if (rFallback.status === 'fulfilled' && rFallback.value.routes) {
      collectedRoutes.push(...rFallback.value.routes);
    }
    if (rDetour1.status === 'fulfilled' && rDetour1.value.routes) {
      collectedRoutes.push(...rDetour1.value.routes);
    }
    if (rDetour2.status === 'fulfilled' && rDetour2.value.routes) {
      collectedRoutes.push(...rDetour2.value.routes);
    }

    // If still empty, return error
    if (collectedRoutes.length === 0) {
      return res.status(500).json({ success: false, error: 'Could not calculate routes' });
    }

    return res.json({ success: true, data: { routes: collectedRoutes } });
  } catch (err: any) {
    console.error('[RouteProxy] Routing error:', err);
    res.status(500).json({ success: false, error: err.message || 'Routing calculation failed' });
  }
});
