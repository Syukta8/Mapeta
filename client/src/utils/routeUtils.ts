import type { RouteInfo, RouteStep, ManeuverType, Incident } from '../types/navigation';

/**
 * Deduplicates raw OSRM routes, detects tolls, and calculates traffic delay penalties from active incidents
 */
export function processMultiRoutes(
  rawRoutes: any[],
  profile: 'driving' | 'bike' | 'foot',
  incidents: Incident[] = []
): RouteInfo[] {
  const seenGeometries = new Set<string>();
  const parsedRoutes: RouteInfo[] = [];

  rawRoutes.forEach((osrmRoute, index) => {
    // Deduplicate identical paths (same start, length, and step count)
    const geomKey = `${Math.round(osrmRoute.distance)}_${Math.round(osrmRoute.duration)}_${osrmRoute.geometry?.coordinates?.length}`;
    if (seenGeometries.has(geomKey)) return;
    seenGeometries.add(geomKey);

    const steps: RouteStep[] = [];
    let detectedToll = false;

    const tollKeywords = [
      'toll', 'tol', 'lebuhraya', 'expressway', 'highway', 'plaza tol', 'e1', 'e2', 'e11',
      'plus', 'mex', 'duke', 'ldp', 'kesas', 'smart', 'spe', 'npe', 'sprint', 'guthrie', 'silk'
    ];

    if (osrmRoute.legs && osrmRoute.legs.length > 0) {
      for (const leg of osrmRoute.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            const maneuver = step.maneuver || {};
            const type = mapOSRMType(maneuver.type, maneuver.modifier);
            const name = step.name || 'Unnamed Road';
            const instruction = generateInstruction(type, maneuver.modifier, name);

            const lowerName = name.toLowerCase();
            if (tollKeywords.some((k) => lowerName.includes(k))) {
              detectedToll = true;
            }

            steps.push({
              distance: step.distance || 0,
              duration: step.duration || 0,
              name,
              instruction,
              maneuverType: type,
              modifier: maneuver.modifier,
              location: maneuver.location || [0, 0],
            });
          }
        }
      }
    }

    const rawDistance = Math.round(osrmRoute.distance || 0);
    const rawDuration = Math.round(osrmRoute.duration || 0);

    // Calculate traffic delay penalties by checking proximity of incidents to route polyline
    const coords = osrmRoute.geometry?.coordinates || [];
    let trafficDelaySec = 0;
    let incidentCount = 0;
    let hasHeavyJam = false;

    if (coords.length > 0 && incidents.length > 0) {
      incidents.forEach((inc) => {
        // Simple distance check: is incident within ~250m of any route segment
        const isNearRoute = coords.some((c: [number, number]) => {
          const dLng = Math.abs(c[0] - inc.lng);
          const dLat = Math.abs(c[1] - inc.lat);
          return dLng < 0.003 && dLat < 0.003;
        });

        if (isNearRoute) {
          incidentCount += 1;
          if (inc.type === 'jam') {
            trafficDelaySec += 360 + Math.min(inc.upvotes * 60, 600); // 6-16 min delay per jam
            hasHeavyJam = true;
          } else if (inc.type === 'accident' || inc.type === 'closure') {
            trafficDelaySec += 300; // 5 min delay
            hasHeavyJam = true;
          } else {
            trafficDelaySec += 90; // 1.5 min delay for hazard/police
          }
        }
      });
    }

    let trafficStatus: 'smooth' | 'moderate' | 'heavy' = 'smooth';
    if (hasHeavyJam || trafficDelaySec > 300) {
      trafficStatus = 'heavy';
    } else if (trafficDelaySec > 0 || incidentCount > 0) {
      trafficStatus = 'moderate';
    }

    let tollFareEstimate = 'Free';
    if (profile === 'driving' && detectedToll) {
      const distKm = rawDistance / 1000;
      if (distKm > 30) {
        tollFareEstimate = '~RM 4.80';
      } else if (distKm > 15) {
        tollFareEstimate = '~RM 2.50';
      } else {
        tollFareEstimate = '~RM 1.60';
      }
    }

    const summary = osrmRoute.legs?.[0]?.summary || `Via ${steps[1]?.name || 'Expressway'}`;
    const label = detectedToll ? 'Expressway' : 'Toll-Free Route';

    parsedRoutes.push({
      id: `route-${index}-${Date.now()}`,
      distance: rawDistance,
      rawDuration,
      trafficDelaySec,
      duration: rawDuration + trafficDelaySec,
      geometry: osrmRoute.geometry,
      steps,
      summary,
      profile,
      hasTolls: profile === 'driving' ? detectedToll : false,
      tollFareEstimate: profile === 'driving' && detectedToll ? tollFareEstimate : 'Free',
      label,
      trafficStatus,
      incidentCount,
    });
  });

  return parsedRoutes;
}

function mapOSRMType(type: string, modifier?: string): ManeuverType {
  switch (type) {
    case 'turn':
      if (modifier === 'left') return 'turn-left';
      if (modifier === 'right') return 'turn-right';
      if (modifier === 'slight left') return 'turn-slight-left';
      if (modifier === 'slight right') return 'turn-slight-right';
      if (modifier === 'sharp left') return 'turn-sharp-left';
      if (modifier === 'sharp right') return 'turn-sharp-right';
      if (modifier === 'uturn') return 'u-turn';
      return 'straight';
    case 'new name':
    case 'continue':
      return 'straight';
    case 'roundabout':
    case 'rotary':
      return 'roundabout';
    case 'merge':
      return 'merge';
    case 'on ramp':
      return 'on-ramp';
    case 'off ramp':
      return 'off-ramp';
    case 'fork':
      return 'fork';
    case 'arrive':
      return 'arrive';
    case 'depart':
      return 'depart';
    default:
      return 'straight';
  }
}

function generateInstruction(type: ManeuverType, _modifier?: string, roadName?: string): string {
  const road = roadName && roadName !== 'Unnamed Road' ? ` onto ${roadName}` : '';
  switch (type) {
    case 'turn-left': return `Turn left${road}`;
    case 'turn-right': return `Turn right${road}`;
    case 'turn-slight-left': return `Keep slight left${road}`;
    case 'turn-slight-right': return `Keep slight right${road}`;
    case 'turn-sharp-left': return `Sharp left${road}`;
    case 'turn-sharp-right': return `Sharp right${road}`;
    case 'roundabout': return `Enter roundabout and take exit${road}`;
    case 'merge': return `Merge${road}`;
    case 'on-ramp': return `Take ramp${road}`;
    case 'off-ramp': return `Take exit${road}`;
    case 'u-turn': return 'Make a U-turn';
    case 'arrive': return 'Arrive at destination';
    case 'depart':
    case 'straight':
    default:
      return `Continue straight${road}`;
  }
}
