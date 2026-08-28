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
      return `${hrs}h ${remMins}m`;
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
      <div className="glass-genshin rounded-2xl p-4 shadow-2xl flex flex-col gap-3.5 border border-[#d3bc8e]/40">
        <div className="flex items-center justify-between border-b border-[#d3bc8e]/20 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#0c1322]/80 border border-[#d3bc8e]/30 rounded-xl">
            <button
              onClick={() => onSelectProfile('driving')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedProfile === 'driving'
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md font-semibold'
                  : 'text-[#ede8db]/70 hover:text-[#f7f4ee]'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive</span>
            </button>
            <button
              onClick={() => onSelectProfile('bike')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedProfile === 'bike'
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md font-semibold'
                  : 'text-[#ede8db]/70 hover:text-[#f7f4ee]'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bike</span>
            </button>
            <button
              onClick={() => onSelectProfile('foot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedProfile === 'foot'
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md font-semibold'
                  : 'text-[#ede8db]/70 hover:text-[#f7f4ee]'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>

          {selectedProfile === 'driving' && (
            <button
              onClick={onToggleAvoidTolls}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                avoidTolls
                  ? 'bg-[#5ce1e6]/20 border-[#5ce1e6]/50 text-[#5ce1e6]'
                  : 'bg-[#0c1322]/80 border-[#d3bc8e]/20 text-[#ede8db]/70 hover:border-[#d3bc8e]/40'
              }`}
              title="Avoid Tolls"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{avoidTolls ? 'No Tolls' : 'Allow Tolls'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0c1322]/80 text-[#ede8db]/70 hover:text-[#f7f4ee] border border-[#d3bc8e]/20 hover:border-[#d3bc8e]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {allRoutes.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allRoutes.map((r, idx) => {
              const isSelected = idx === selectedRouteIndex;
              const diffSec = r.duration - allRoutes[0].duration;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectRouteIndex(idx)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#d3bc8e]/15 border-[#d3bc8e] shadow-md shadow-[#d3bc8e]/10'
                      : 'bg-[#0c1322]/60 border-[#d3bc8e]/20 hover:border-[#d3bc8e]/40 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-cinzel font-bold ${isSelected ? 'text-[#d3bc8e]' : 'text-slate-400'}`}>
                      {idx === 0 ? '✦ FASTEST' : `✦ ALT ${idx}`}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-[#d3bc8e]" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-[#f7f4ee] font-cinzel">{formatDuration(r.duration)}</span>
                    {idx > 0 && diffSec > 0 && (
                      <span className="text-[10px] text-amber-400">+{Math.round(diffSec / 60)}m</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#ede8db]/70">
                    <span>{formatDist(r.distance)}</span>
                    <span className={`font-semibold ${r.hasTolls ? 'text-amber-400' : 'text-[#5ce1e6]'}`}>
                      {r.hasTolls ? r.tollFareEstimate : 'Toll-free'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#f7f4ee] font-cinzel leading-none">
                {formatDuration(route.duration)}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                route.hasTolls
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#5ce1e6]/20 text-[#5ce1e6] border-[#5ce1e6]/40'
              }`}>
                {route.hasTolls ? `Toll: ${route.tollFareEstimate}` : 'Toll-Free ✦'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#ede8db]/70 mt-1">
              <span>{formatDist(route.distance)}</span>
              <span>•</span>
              <span>Arrive at {arrivalTime(route.duration)}</span>
              <span>•</span>
              <span className="text-[#d3bc8e] truncate max-w-[130px]">{route.summary}</span>
            </div>
          </div>

          <button
            onClick={onStartNavigation}
            className="gold-btn flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm active:scale-95 transition-all"
          >
            <Navigation2 className="w-4 h-4 fill-current" />
            <span className="font-cinzel tracking-wider">NAVIGATE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
