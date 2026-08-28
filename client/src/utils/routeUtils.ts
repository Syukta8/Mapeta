import type { RouteInfo, RouteStep, ManeuverType, Incident } from '../types/navigation';
import { calculateLLMTolls } from './tollEngine';

/**
 * Deduplicates raw OSRM routes, detects LLM tolls, and calculates traffic delay penalties from active incidents
 */
export function processMultiRoutes(
  rawRoutes: any[],
  profile: 'driving' | 'bike' | 'foot',
  incidents: Incident[] = []
): RouteInfo[] {
  const parsedRoutes: RouteInfo[] = [];

  rawRoutes.forEach((osrmRoute, index) => {
    const rawDistance = Math.round(osrmRoute.distance || 0);
    const rawDuration = Math.round(osrmRoute.duration || 0);
    const coords = osrmRoute.geometry?.coordinates || [];

    if (coords.length === 0) return;

    // Check if this route is substantially distinct (distance diff > 500m or time diff > 60s)
    const isDuplicate = parsedRoutes.some((existing) => {
      const distDiff = Math.abs(existing.distance - rawDistance);
      const timeDiff = Math.abs(existing.rawDuration - rawDuration);
      return distDiff < 600 && timeDiff < 90;
    });

    if (isDuplicate) return;

    const steps: RouteStep[] = [];

    if (osrmRoute.legs && osrmRoute.legs.length > 0) {
      for (const leg of osrmRoute.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            const maneuver = step.maneuver || {};
            const type = mapOSRMType(maneuver.type, maneuver.modifier);
            const name = step.name || 'Unnamed Road';
            const instruction = generateInstruction(type, maneuver.modifier, name);

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

    // Calculate LLM Toll Fares & Itemized Expressway Breakdown
    const tollResult = profile === 'driving' ? calculateLLMTolls(steps) : {
      hasTolls: false,
      totalFare: 0,
      formattedTotal: 'Free',
      breakdown: [],
    };

    // Traffic congestion penalty calculation from active incidents
    let trafficDelaySec = 0;
    let incidentCount = 0;
    let hasHeavyJam = false;

    if (coords.length > 0 && incidents.length > 0) {
      incidents.forEach((inc) => {
        const isNearRoute = coords.some((c: [number, number]) => {
          const dLng = Math.abs(c[0] - inc.lng);
          const dLat = Math.abs(c[1] - inc.lat);
          return dLng < 0.003 && dLat < 0.003;
        });

        if (isNearRoute) {
          incidentCount += 1;
          if (inc.type === 'jam') {
            trafficDelaySec += 360 + Math.min(inc.upvotes * 60, 600); // 6 to 16 min delay
            hasHeavyJam = true;
          } else if (inc.type === 'accident' || inc.type === 'closure') {
            trafficDelaySec += 300;
            hasHeavyJam = true;
          } else {
            trafficDelaySec += 90;
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

    const summary = osrmRoute.legs?.[0]?.summary || `Via ${steps[1]?.name || 'Highway'}`;
    const label = tollResult.hasTolls ? 'Expressway (Toll)' : 'Federal / Trunk Road';

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
      hasTolls: tollResult.hasTolls,
      tollFareEstimate: tollResult.formattedTotal,
      tollTotal: tollResult.totalFare,
      tollBreakdown: tollResult.breakdown,
      label,
      trafficStatus,
      incidentCount,
    });
  });

  return parsedRoutes.sort((a, b) => a.duration - b.duration);
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
