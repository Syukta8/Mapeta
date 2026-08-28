import pathlib

route_utils = """import type { RouteInfo, RouteStep, ManeuverType } from '../types/navigation';

/**
 * Parses raw OSRM route response into structured RouteInfo
 */
export function parseOSRMRoute(osrmRoute: any, profile: 'driving' | 'bike' | 'foot' = 'driving'): RouteInfo {
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

  return {
    distance: Math.round(osrmRoute.distance || 0),
    duration: Math.round(osrmRoute.duration || 0),
    geometry: osrmRoute.geometry,
    steps,
    summary: osrmRoute.legs?.[0]?.summary || 'Fastest route',
    profile,
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

function generateInstruction(type: ManeuverType, modifier?: string, roadName?: string): string {
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
"""

route_summary = """import { Car, Bike, Footprints, Navigation2, X, Clock, Route as RouteIcon } from 'lucide-react';
import type { RouteInfo } from '../../types/navigation';

interface RouteSummaryProps {
  route: RouteInfo;
  alternativeRoutes?: RouteInfo[];
  selectedProfile: 'driving' | 'bike' | 'foot';
  onSelectProfile: (profile: 'driving' | 'bike' | 'foot') => void;
  onStartNavigation: () => void;
  onClose: () => void;
}

export function RouteSummary({
  route,
  alternativeRoutes = [],
  selectedProfile,
  onSelectProfile,
  onStartNavigation,
  onClose,
}: RouteSummaryProps) {
  const formatDist = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} hr ${remMins} min`;
    }
    return `${mins} min`;
  };

  const arrivalTime = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="absolute bottom-3 left-3 right-3 z-40 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        {/* Top Profile Picker & Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
            <button
              onClick={() => onSelectProfile('driving')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedProfile === 'driving'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive</span>
            </button>
            <button
              onClick={() => onSelectProfile('bike')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedProfile === 'bike'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bike</span>
            </button>
            <button
              onClick={() => onSelectProfile('foot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedProfile === 'foot'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Route ETA & Info */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white leading-none">
                {formatDuration(route.duration)}
              </span>
              <span className="text-sm font-semibold text-emerald-400">Fastest</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>{formatDist(route.distance)}</span>
              <span>•</span>
              <span>Arrive at {arrivalTime}</span>
              <span>•</span>
              <span className="text-slate-300 truncate max-w-[140px]">{route.summary}</span>
            </div>
          </div>

          {/* Big Start Button */}
          <button
            onClick={onStartNavigation}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 active:scale-95 transition-all"
          >
            <Navigation2 className="w-5 h-5 fill-current" />
            <span>Go</span>
          </button>
        </div>
      </div>
    </div>
  );
}
"""

pathlib.Path('client/src/utils').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/components/UI').mkdir(parents=True, exist_ok=True)

pathlib.Path('client/src/utils/routeUtils.ts').write_text(route_utils, encoding='utf-8')
pathlib.Path('client/src/components/UI/RouteSummary.tsx').write_text(route_summary, encoding='utf-8')
print('Stage 3 Route utilities and summary generated successfully!')