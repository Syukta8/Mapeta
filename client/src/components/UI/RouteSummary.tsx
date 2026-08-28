import { Car, Bike, Footprints, Navigation2, X, DollarSign, Check } from 'lucide-react';
import type { RouteInfo } from '../../types/navigation';

interface RouteSummaryProps {
  route: RouteInfo;
  allRoutes: RouteInfo[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (index: number) => void;
  selectedProfile: 'driving' | 'bike' | 'foot';
  onSelectProfile: (profile: 'driving' | 'bike' | 'foot') => void;
  avoidTolls: boolean;
  onToggleAvoidTolls: () => void;
  onStartNavigation: () => void;
  onClose: () => void;
}

export function RouteSummary({
  route,
  allRoutes,
  selectedRouteIndex,
  onSelectRouteIndex,
  selectedProfile,
  onSelectProfile,
  avoidTolls,
  onToggleAvoidTolls,
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

  const arrivalTime = (durationSec: number) =>
    new Date(Date.now() + durationSec * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="absolute bottom-3 left-3 right-3 z-40 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5">
        {/* Top Transport Mode & Avoid Tolls Switch */}
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

          {/* Avoid Tolls Toggle Button (for driving) */}
          {selectedProfile === 'driving' && (
            <button
              onClick={onToggleAvoidTolls}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                avoidTolls
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Avoid Toll Roads"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{avoidTolls ? 'No Tolls' : 'Allow Tolls'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multiple Route Option Cards (if alternatives exist) */}
        {allRoutes.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allRoutes.map((r, idx) => {
              const isSelected = idx === selectedRouteIndex;
              const diffSec = r.duration - allRoutes[0].duration;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectRouteIndex(idx)}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-500 shadow-md shadow-sky-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-sky-400' : 'text-slate-400'}`}>
                      {idx === 0 ? 'Fastest' : `Alt ${idx}`}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-sky-400" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-white">{formatDuration(r.duration)}</span>
                    {idx > 0 && diffSec > 0 && (
                      <span className="text-[10px] text-amber-400">+{Math.round(diffSec / 60)}m</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatDist(r.distance)}</span>
                    <span className={`font-semibold ${r.hasTolls ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {r.hasTolls ? r.tollFareEstimate : 'Toll-free'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Selected Route Summary & GO Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white leading-none">
                {formatDuration(route.duration)}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                route.hasTolls
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {route.hasTolls ? `Toll: ${route.tollFareEstimate}` : 'Toll-Free 🆓'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>{formatDist(route.distance)}</span>
              <span>•</span>
              <span>Arrive at {arrivalTime(route.duration)}</span>
              <span>•</span>
              <span className="text-slate-300 truncate max-w-[130px]">{route.summary}</span>
            </div>
          </div>

          {/* Big Start Go Button */}
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
