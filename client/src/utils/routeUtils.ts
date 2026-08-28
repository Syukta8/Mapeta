import type { RouteInfo, RouteStep, ManeuverType } from '../types/navigation';

/**
 * Parses raw OSRM route response into structured RouteInfo with Toll Detection
 */
export function parseOSRMRoute(
  osrmRoute: any,
  profile: 'driving' | 'bike' | 'foot' = 'driving',
  index: number = 0
): RouteInfo {
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

  const summary = osrmRoute.legs?.[0]?.summary || (index === 0 ? 'Fastest route' : `Via ${steps[1]?.name || 'Alternative'}`);
  const label = index === 0 ? 'Fastest' : index === 1 ? 'Alternative 1' : `Alternative ${index}`;

  let tollFareEstimate = 'Free';
  if (profile === 'driving' && detectedToll) {
    const distKm = (osrmRoute.distance || 0) / 1000;
    if (distKm > 30) {
      tollFareEstimate = '~RM 4.80';
    } else if (distKm > 15) {
      tollFareEstimate = '~RM 2.50';
    } else {
      tollFareEstimate = '~RM 1.60';
    }
  }

  return {
    id: `route-${index}-${Date.now()}`,
    distance: Math.round(osrmRoute.distance || 0),
    duration: Math.round(osrmRoute.duration || 0),
    geometry: osrmRoute.geometry,
    steps,
    summary,
    profile,
    hasTolls: profile === 'driving' ? detectedToll : false,
    tollFareEstimate: profile === 'driving' && detectedToll ? tollFareEstimate : 'Free',
    label,
  };
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
    case 'turn-left':
      return `Turn left${road}`;
    case 'turn-right':
      return `Turn right${road}`;
    case 'turn-slight-left':
      return `Keep slight left${road}`;
    case 'turn-slight-right':
      return `Keep slight right${road}`;
    case 'turn-sharp-left':
      return `Sharp left${road}`;
    case 'turn-sharp-right':
      return `Sharp right${road}`;
    case 'roundabout':
      return `Enter roundabout and take exit${road}`;
    case 'merge':
      return `Merge${road}`;
    case 'on-ramp':
      return `Take ramp${road}`;
    case 'off-ramp':
      return `Take exit${road}`;
    case 'u-turn':
      return 'Make a U-turn';
    case 'arrive':
      return 'Arrive at destination';
    case 'depart':
    case 'straight':
    default:
      return `Continue straight${road}`;
  }
}
