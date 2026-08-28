import { Router } from 'express';

export const routeRouter = Router();

// GET /api/route?start=lng,lat&end=lng,lat&profile=driving|bike|foot&combineTollOptions=true
routeRouter.get('/', async (req, res) => {
  try {
    const { start, end, profile = 'driving', avoidTolls = 'false' } = req.query;

    if (!start || !end) {
      return res.status(400).json({ success: false, error: 'Start and end coordinates required (format: lng,lat)' });
    }

    const mode = profile === 'bike' ? 'bike' : profile === 'foot' ? 'foot' : 'driving';

    // If driving, fetch both standard (with tolls) and toll-free alternatives concurrently
    if (mode === 'driving') {
      const urlStandard = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=true`;
      const urlTollFree = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=true&exclude=toll`;

      const [resStandard, resTollFree] = await Promise.allSettled([
        fetch(urlStandard, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }),
        fetch(urlTollFree, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } }),
      ]);

      const allRoutes = [];

      if (resStandard.status === 'fulfilled' && resStandard.value.ok) {
        const data = await resStandard.value.json();
        if (data.routes) allRoutes.push(...data.routes);
      }

      if (resTollFree.status === 'fulfilled' && resTollFree.value.ok) {
        const data = await resTollFree.value.json();
        if (data.routes) allRoutes.push(...data.routes);
      }

      if (allRoutes.length === 0) {
        // Fallback to project-osrm
        const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=true`;
        const fbRes = await fetch(fallbackUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
        const fbData = await fbRes.json();
        return res.json({ success: true, data: fbData });
      }

      return res.json({ success: true, data: { routes: allRoutes } });
    }

    // Non-driving modes
    const osrmUrl = `https://routing.openstreetmap.de/routed-${mode}/route/v1/${mode}/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=true`;
    const response = await fetch(osrmUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[RouteProxy] Routing error:', err);
    res.status(500).json({ success: false, error: err.message || 'Routing calculation failed' });
  }
});
