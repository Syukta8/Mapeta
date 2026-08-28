import { Car, Bike, Footprints, Navigation2, X } from 'lucide-react';
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
              {alternativeRoutes.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-sky-400 font-semibold">+{alternativeRoutes.length} alt</span>
                </>
              )}
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
