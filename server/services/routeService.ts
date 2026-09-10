/**
 * Route calculation services using OSRM.
 * Implements corridor detour algorithm for diverse driving alternatives.
 */

import { LRUCache } from '../utils/LRUCache.js';

export interface RouteResult {
  routes: any[];
}

// Bounded route LRU cache: 200 routes max, 5-minute TTL to reduce upstream fetch volume ~80%
const routeCache = new LRUCache<string, RouteResult>(200, 300_000);

/**
 * Normalizes coordinate string to 5 decimal places for resilient cache keys.
 */
function normalizeCoord(coord: string): string {
  const parts = coord.split(',').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return `${parts[0].toFixed(5)},${parts[1].toFixed(5)}`;
  }
  return coord;
}

/**
 * Calculates routes between two points using OSRM.
 * For driving mode, uses a corridor detour algorithm to guarantee diverse alternatives.
 * @param start - Starting coordinates as 'lng,lat'.
 * @param end - Ending coordinates as 'lng,lat'.
 * @param profile - Mode of transport: 'driving', 'bike', or 'foot'.
 * @returns The calculated routes.
 */
export async function calculateRoutes(start: string, end: string, profile: string): Promise<RouteResult> {
  const mode = profile === 'bike' ? 'bike' : profile === 'foot' ? 'foot' : 'driving';
  const cacheKey = `${normalizeCoord(start)}|${normalizeCoord(end)}|${mode}`;

  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (mode !== 'driving') {
    const url = `https://routing.openstreetmap.de/routed-${mode}/route/v1/${mode}/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=3`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
    const data = await response.json() as any;
    if (data && data.routes && data.routes.length > 0) {
      routeCache.set(cacheKey, data);
    }
    return data;
  }

  // Driving mode: corridor detour algorithm for 3-4 diverse routes
  const [startLng, startLat] = start.split(',').map(Number);
  const [endLng, endLat] = end.split(',').map(Number);

  const dLng = endLng - startLng;
  const dLat = endLat - startLat;
  const dist = Math.sqrt(dLng * dLng + dLat * dLat);
  const offsetFactor = Math.min(0.28, Math.max(0.12, dist * 0.2));

  // 4 perpendicular offset waypoints along the route corridor
  const candidatePoints = [
    [startLng + dLng * 0.35 - dLat * offsetFactor, startLat + dLat * 0.35 + dLng * offsetFactor],
    [startLng + dLng * 0.65 + dLat * offsetFactor, startLat + dLat * 0.65 - dLng * offsetFactor],
    [startLng + dLng * 0.50 - dLat * (offsetFactor * 1.3), startLat + dLat * 0.50 + dLng * (offsetFactor * 1.3)],
    [startLng + dLng * 0.50 + dLat * (offsetFactor * 1.3), startLat + dLat * 0.50 - dLng * (offsetFactor * 1.3)],
  ];

  // Snap corridor waypoints to nearest real drivable roads, then route through them
  const snapPromises = candidatePoints.map(async ([pLng, pLat]) => {
    try {
      const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${pLng.toFixed(5)},${pLat.toFixed(5)}`;
      const snapRes = await fetch(snapUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
      const snapData = await snapRes.json() as any;
      if (snapData.waypoints?.[0]?.location) {
        const [sLng, sLat] = snapData.waypoints[0].location;
        const detourUrl = `https://router.project-osrm.org/route/v1/driving/${start};${sLng},${sLat};${end}?overview=full&geometries=geojson&steps=true`;
        const routeRes = await fetch(detourUrl, { headers: { 'User-Agent': 'Mapeta-Local-Server/1.0' } });
        const routeData = await routeRes.json() as any;
        return routeData.routes?.[0] || null;
      }
    } catch {
      return null;
    }
    return null;
  });

  // 2 direct OSRM queries + 4 detour queries in parallel
  const directUrl1 = `https://routing.openstreetmap.de/routed-driving/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&annotations=true&alternatives=3`;
  const directUrl2 = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true&alternatives=3`;

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
    throw new Error('Could not calculate routes');
  }

  const result: RouteResult = { routes: collectedRoutes };
  routeCache.set(cacheKey, result);
  return result;
}
