import type { RouteInfo, RouteStep, ManeuverType, Incident } from '../models/navigation.js';
import { calculateLLMTolls } from './tollEngine.js';

interface TrafficImpact {
  delaySec: number;
  incidentCount: number;
  status: 'smooth' | 'moderate' | 'heavy';
}

/**
 * Parses raw OSRM legs into normalized navigation steps
 */
export function parseRouteSteps(legs: any[] = []): RouteStep[] {
  const steps: RouteStep[] = [];
  for (const leg of legs) {
    if (!leg.steps) continue;
    for (const step of leg.steps) {
      const maneuver = step.maneuver || {};
      const type = mapOSRMType(maneuver.type, maneuver.modifier);
      const name = step.name || (step.ref ? `Lebuhraya ${step.ref}` : 'Unnamed Road');
      const ref = step.ref || undefined;
      const instruction = generateInstruction(type, name);

      steps.push({
        distance: step.distance || 0,
        duration: step.duration || 0,
        name,
        ref,
        instruction,
        maneuverType: type,
        modifier: maneuver.modifier,
        location: maneuver.location || [0, 0],
      });
    }
  }
  return steps;
}

/**
 * Calculates traffic delays and congestion status from nearby crowd incidents
 */
export function calculateRouteTrafficImpact(
  coords: [number, number][],
  incidents: Incident[] = []
): TrafficImpact {
  if (coords.length === 0 || incidents.length === 0) {
    return { delaySec: 0, incidentCount: 0, status: 'smooth' };
  }

  let delaySec = 0;
  let incidentCount = 0;
  let hasHeavyJam = false;

  for (const inc of incidents) {
    const isNearRoute = coords.some(
      (c) => Math.abs(c[0] - inc.lng) < 0.003 && Math.abs(c[1] - inc.lat) < 0.003
    );

    if (isNearRoute) {
      incidentCount += 1;
      if (inc.type === 'jam') {
        delaySec += 360 + Math.min(inc.upvotes * 60, 600);
        hasHeavyJam = true;
      } else if (inc.type === 'accident' || inc.type === 'closure') {
        delaySec += 300;
        hasHeavyJam = true;
      } else {
        delaySec += 90;
      }
    }
  }

  const status = hasHeavyJam || delaySec > 300 ? 'heavy' : delaySec > 0 || incidentCount > 0 ? 'moderate' : 'smooth';
  return { delaySec, incidentCount, status };
}

/**
 * Checks if a route candidate is duplicate to existing parsed routes
 */
function isDuplicateRoute(existingRoutes: RouteInfo[], distance: number, duration: number): boolean {
  return existingRoutes.some((r) => {
    return Math.abs(r.distance - distance) < 800 && Math.abs(r.rawDuration - duration) < 90;
  });
}

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
    const coords: [number, number][] = osrmRoute.geometry?.coordinates || [];

    if (coords.length === 0 || isDuplicateRoute(parsedRoutes, rawDistance, rawDuration)) {
      return;
    }

    const steps = parseRouteSteps(osrmRoute.legs);
    const tollResult = profile === 'driving'
      ? calculateLLMTolls(steps)
      : { hasTolls: false, totalFare: 0, formattedTotal: 'Free', breakdown: [] };

    const traffic = calculateRouteTrafficImpact(coords, incidents);
    const summary = osrmRoute.legs?.[0]?.summary || `Via ${steps[1]?.name || 'Highway'}`;
    const label = tollResult.hasTolls ? 'Expressway (Toll)' : 'Federal / Trunk Road';

    parsedRoutes.push({
      id: `route-${index}-${Date.now()}`,
      distance: rawDistance,
      rawDuration,
      trafficDelaySec: traffic.delaySec,
      duration: rawDuration + traffic.delaySec,
      geometry: osrmRoute.geometry,
      steps,
      summary,
      profile,
      hasTolls: tollResult.hasTolls,
      tollFareEstimate: tollResult.formattedTotal,
      tollTotal: tollResult.totalFare,
      tollBreakdown: tollResult.breakdown,
      label,
      trafficStatus: traffic.status,
      incidentCount: traffic.incidentCount,
    });
  });

  return parsedRoutes.sort((a, b) => a.duration - b.duration).slice(0, 4);
}

const MANEUVER_MAP: Record<string, ManeuverType> = {
  'turn-left': 'turn-left',
  'turn-right': 'turn-right',
  'turn-slight left': 'turn-slight-left',
  'turn-slight right': 'turn-slight-right',
  'turn-sharp left': 'turn-sharp-left',
  'turn-sharp right': 'turn-sharp-right',
  'turn-uturn': 'u-turn',
  'new name': 'straight',
  continue: 'straight',
  roundabout: 'roundabout',
  rotary: 'roundabout',
  merge: 'merge',
  'on ramp': 'on-ramp',
  'off ramp': 'off-ramp',
  fork: 'fork',
  arrive: 'arrive',
  depart: 'depart',
};

function mapOSRMType(type: string, modifier?: string): ManeuverType {
  const key = modifier ? `${type}-${modifier}` : type;
  return MANEUVER_MAP[key] || MANEUVER_MAP[type] || 'straight';
}

function generateInstruction(type: ManeuverType, roadName?: string): string {
  const road = roadName && roadName !== 'Unnamed Road' ? ` onto ${roadName}` : '';
  const instructions: Record<ManeuverType, string> = {
    'turn-left': `Turn left${road}`,
    'turn-right': `Turn right${road}`,
    'turn-slight-left': `Keep slight left${road}`,
    'turn-slight-right': `Keep slight right${road}`,
    'turn-sharp-left': `Sharp left${road}`,
    'turn-sharp-right': `Sharp right${road}`,
    roundabout: `Enter roundabout and take exit${road}`,
    merge: `Merge${road}`,
    fork: `Keep in lane at fork${road}`,
    'on-ramp': `Take ramp${road}`,
    'off-ramp': `Take exit${road}`,
    'u-turn': 'Make a U-turn',
    arrive: 'Arrive at destination',
    depart: `Start route${road}`,
    straight: `Continue straight${road}`,
  };
  return instructions[type] || `Continue straight${road}`;
}
