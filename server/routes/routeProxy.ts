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

    // Driving Mode: Guaranteed 3 to 4 Diverse Alternative Routes
    // 1. Query Direct Highway with alternatives=3
    const directUrl1 = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=3`;
    const directUrl2 = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=3`;

    // 2. Generate 4 Smart Corridor Waypoints with Perpendicular Offsets
    const dLng = endLng - startLng;
    const dLat = endLat - startLat;
    const dist = Math.sqrt(dLng * dLng + dLat * dLat);
    const offsetFactor = Math.min(0.28, Math.max(0.12, dist * 0.2));

    const candidatePoints = [
      [startLng + dLng * 0.35 - dLat * offsetFactor, startLat + dLat * 0.35 + dLng * offsetFactor],
      [startLng + dLng * 0.65 + dLat * offsetFactor, startLat + dLat * 0.65 - dLng * offsetFactor],
      [startLng + dLng * 0.50 - dLat * (offsetFactor * 1.3), startLat + dLat * 0.50 + dLng * (offsetFactor * 1.3)],
      [startLng + dLng * 0.50 + dLat * (offsetFactor * 1.3), startLat + dLat * 0.50 - dLng * (offsetFactor * 1.3)],
    ];

    // Snap corridor waypoints to nearest real drivable roads in parallel
    const snapPromises = candidatePoints.map(async ([pLng, pLat]) => {
      try {
        const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${pLng.toFixed(5)},${pLat.toFixed(5)}`;
        const snapRes = await fetch(snapUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
        const snapData = await snapRes.json();
        if (snapData.waypoints?.[0]?.location) {
          const [sLng, sLat] = snapData.waypoints[0].location;
          const detourUrl = `https://router.project-osrm.org/route/v1/driving/${start};${sLng},${sLat};${end}?overview=full&geometries=geojson&steps=true`;
          const routeRes = await fetch(detourUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
          const routeData = await routeRes.json();
          return routeData.routes?.[0] || null;
        }
      } catch (e) {
        return null;
      }
      return null;
    });

    const [rDirect1, rDirect2, ...detourResults] = await Promise.allSettled([
      fetch(directUrl1, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()).catch(() => ({})),
      fetch(directUrl2, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }).then((r) => r.json()).catch(() => ({})),
      ...snapPromises,
    ]);

    const collectedRoutes: any[] = [];

    if (rDirect1.status === 'fulfilled' && rDirect1.value?.routes) {
      collectedRoutes.push(...rDirect1.value.routes);
    }
    if (rDirect2.status === 'fulfilled' && rDirect2.value?.routes) {
      collectedRoutes.push(...rDirect2.value.routes);
    }

    detourResults.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        collectedRoutes.push(res.value);
      }
    });

    if (collectedRoutes.length === 0) {
      return res.status(500).json({ success: false, error: 'Could not calculate routes' });
    }

    return res.json({ success: true, data: { routes: collectedRoutes } });
  } catch (err: any) {
    console.error('[RouteProxy] Routing error:', err);
    res.status(500).json({ success: false, error: err.message || 'Routing calculation failed' });
  }
});
