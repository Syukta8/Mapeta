import type { RouteInfo, TravelProfile } from './NavigationModel';

import { API_BASE } from '../config';

export class RouteService {
  public static async fetchRoutes(
    start: [number, number],
    end: [number, number],
    profile: TravelProfile
  ): Promise<RouteInfo[]> {
    try {
      const url = `${API_BASE}/api/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&profile=${profile}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data.routes && json.data.routes.length > 0) {
        return json.data.routes;
      }
      return [];
    } catch (err) {
      console.error('[RouteService] Failed to fetch routes:', err);
      return [];
    }
  }
}
