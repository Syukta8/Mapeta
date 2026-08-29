import type { RouteInfo, TravelProfile } from './NavigationModel';
import type { Incident } from './IncidentModel';
import { processMultiRoutes } from '../utils/routeUtils';

export class RouteService {
  public static async fetchRoutes(
    start: [number, number],
    end: [number, number],
    profile: TravelProfile,
    incidents: Incident[] = []
  ): Promise<RouteInfo[]> {
    try {
      const url = `/api/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&profile=${profile}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data.routes && json.data.routes.length > 0) {
        return processMultiRoutes(json.data.routes, profile, incidents);
      }
      return [];
    } catch (err) {
      console.error('[RouteService] Failed to fetch routes:', err);
      return [];
    }
  }
}
