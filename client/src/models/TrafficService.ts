import type { Incident } from './IncidentModel';
import type { TrafficGeoJSON, TrafficCongestionStatus } from './TrafficModel';
import type { RouteInfo } from './NavigationModel';

export class TrafficService {
  /**
   * Generates silky-smooth traffic segments directly mapped along the active route's actual curved coordinates
   */
  public static generateRouteTrafficGeoJSON(
    activeRoute: RouteInfo | null,
    incidents: Incident[] = []
  ): TrafficGeoJSON {
    if (!activeRoute || !activeRoute.geometry?.coordinates || activeRoute.geometry.coordinates.length < 2) {
      return { type: 'FeatureCollection', features: [] };
    }

    const coords = activeRoute.geometry.coordinates;
    const features: TrafficGeoJSON['features'] = [];

    // Group route coordinate points into smooth continuous congestion chunks
    let currentChunk: [number, number][] = [coords[0]];
    let currentStatus: TrafficCongestionStatus = 'smooth';

    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      let ptStatus: TrafficCongestionStatus = 'smooth';

      // Check distance from this point on the route to any active incidents
      for (const inc of incidents) {
        const dLng = Math.abs(pt[0] - inc.lng);
        const dLat = Math.abs(pt[1] - inc.lat);
        if (dLng < 0.007 && dLat * Math.cos((pt[1] * Math.PI) / 180) < 0.007) {
          if (inc.type === 'jam') {
            if (inc.subtype === 'Standstill' || inc.upvotes >= 3) {
              ptStatus = 'standstill';
            } else if (inc.subtype === 'Heavy Traffic' || inc.upvotes >= 1) {
              ptStatus = 'heavy';
            } else {
              ptStatus = 'moderate';
            }
          } else if (inc.type === 'accident' || inc.type === 'closure') {
            ptStatus = 'heavy';
          } else if (inc.type === 'hazard') {
            if (ptStatus === 'smooth') {
              ptStatus = 'moderate';
            }
          }
          break;
        }
      }

      if (ptStatus === currentStatus) {
        currentChunk.push(pt);
      } else {
        // Close previous segment
        currentChunk.push(pt);
        if (currentChunk.length >= 2) {
          features.push({
            type: 'Feature',
            properties: {
              id: `route-traffic-${features.length}`,
              name: activeRoute.summary,
              status: currentStatus,
              speedKmh: currentStatus === 'standstill' ? 8 : currentStatus === 'heavy' ? 22 : currentStatus === 'moderate' ? 45 : 90,
            },
            geometry: {
              type: 'LineString',
              coordinates: currentChunk,
            },
          });
        }
        currentChunk = [pt];
        currentStatus = ptStatus;
      }
    }

    if (currentChunk.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          id: `route-traffic-${features.length}`,
          name: activeRoute.summary,
          status: currentStatus,
          speedKmh: currentStatus === 'standstill' ? 8 : currentStatus === 'heavy' ? 22 : currentStatus === 'moderate' ? 45 : 90,
        },
        geometry: {
          type: 'LineString',
          coordinates: currentChunk,
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  /**
   * Generates dynamic traffic flow for regional background expressways when not navigating
   */
  public static generateLiveTrafficGeoJSON(incidents: Incident[] = []): TrafficGeoJSON {
    const features: TrafficGeoJSON['features'] = [];

    // Map traffic glows around individual user-reported jams directly onto regional nodes
    incidents
      .filter((inc) => inc.type === 'jam' || inc.type === 'accident' || inc.type === 'closure')
      .forEach((inc) => {
        const offset = 0.007; // ~800m
        const status: TrafficCongestionStatus =
          inc.subtype === 'Standstill' || inc.type === 'closure'
            ? 'standstill'
            : inc.subtype === 'Heavy Traffic' || inc.type === 'accident'
            ? 'heavy'
            : 'moderate';

        features.push({
          type: 'Feature' as const,
          properties: {
            id: `incident-traffic-${inc.id}`,
            name: inc.title,
            ref: 'JAM',
            status,
            speedKmh: status === 'standstill' ? 5 : status === 'heavy' ? 15 : 35,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [inc.lng - offset, inc.lat - offset * 0.4],
              [inc.lng, inc.lat],
              [inc.lng + offset, inc.lat + offset * 0.4],
            ],
          },
        });
      });

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
