import { useState, useMemo } from 'react';
import { Car, Bike, Footprints, Navigation2, X, Clock, DollarSign, ShieldAlert, Check } from 'lucide-react';
import type { RouteInfo } from '../../types/navigation';

interface RouteSummaryProps {
  allRoutes: RouteInfo[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (index: number) => void;
  selectedProfile: 'driving' | 'bike' | 'foot';
  onSelectProfile: (profile: 'driving' | 'bike' | 'foot') => void;
  onStartNavigation: () => void;
  onClose: () => void;
}

type SortFilter = 'fastest' | 'toll' | 'traffic';

export function RouteSummary({
  allRoutes,
  selectedRouteIndex,
  onSelectRouteIndex,
  selectedProfile,
  onSelectProfile,
  onStartNavigation,
  onClose,
}: RouteSummaryProps) {
  const [sortFilter, setSortFilter] = useState<SortFilter>('fastest');

  // Sorted Route Options Matrix based on active filter
  const sortedRoutes = useMemo(() => {
    const list = [...allRoutes];
    if (sortFilter === 'fastest') {
      return list.sort((a, b) => a.duration - b.duration);
    } else if (sortFilter === 'toll') {
      return list.sort((a, b) => {
        if (a.hasTolls !== b.hasTolls) return a.hasTolls ? 1 : -1;
        return a.duration - b.duration;
      });
    } else if (sortFilter === 'traffic') {
      return list.sort((a, b) => {
        if (a.trafficDelaySec !== b.trafficDelaySec) return a.trafficDelaySec - b.trafficDelaySec;
        return a.duration - b.duration;
      });
    }
    return list;
  }, [allRoutes, sortFilter]);

  const activeRoute = allRoutes[selectedRouteIndex] || sortedRoutes[0];

  const formatDist = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
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
        {/* Top Profile Picker & Close Button */}
        <div className="flex items-center justify-between border-b border-[#d3bc8e]/20 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#0c1322]/80 border border-[#d3bc8e]/30 rounded-xl">
            <button
              onClick={() => onSelectProfile('driving')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedProfile === 'driving'
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md'
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
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md'
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
                  ? 'bg-gradient-to-r from-[#d3bc8e] to-[#bfa175] text-[#0c1322] shadow-md'
                  : 'text-[#ede8db]/70 hover:text-[#f7f4ee]'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0c1322]/80 text-[#ede8db]/70 hover:text-[#f7f4ee] border border-[#d3bc8e]/20 hover:border-[#d3bc8e]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Route Sorting Matrix Tabs (Drive mode) */}
        {selectedProfile === 'driving' && allRoutes.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#0c1322]/60 border border-[#d3bc8e]/20 rounded-xl">
            <button
              onClick={() => {
                setSortFilter('fastest');
                const bestIdx = allRoutes.findIndex((r) => r.id === sortedRoutes[0]?.id);
                if (bestIdx >= 0) onSelectRouteIndex(bestIdx);
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold font-cinzel transition-all ${
                sortFilter === 'fastest'
                  ? 'bg-[#d3bc8e]/20 text-[#d3bc8e] border border-[#d3bc8e]/50 shadow-sm'
                  : 'text-[#ede8db]/60 hover:text-[#ede8db]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Fastest</span>
            </button>
            <button
              onClick={() => {
                setSortFilter('toll');
                const bestIdx = allRoutes.findIndex((r) => r.id === sortedRoutes[0]?.id);
                if (bestIdx >= 0) onSelectRouteIndex(bestIdx);
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold font-cinzel transition-all ${
                sortFilter === 'toll'
                  ? 'bg-[#d3bc8e]/20 text-[#d3bc8e] border border-[#d3bc8e]/50 shadow-sm'
                  : 'text-[#ede8db]/60 hover:text-[#ede8db]'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Lowest Toll</span>
            </button>
            <button
              onClick={() => {
                setSortFilter('traffic');
                const bestIdx = allRoutes.findIndex((r) => r.id === sortedRoutes[0]?.id);
                if (bestIdx >= 0) onSelectRouteIndex(bestIdx);
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold font-cinzel transition-all ${
                sortFilter === 'traffic'
                  ? 'bg-[#d3bc8e]/20 text-[#d3bc8e] border border-[#d3bc8e]/50 shadow-sm'
                  : 'text-[#ede8db]/60 hover:text-[#ede8db]'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Least Traffic</span>
            </button>
          </div>
        )}

        {/* Multi-Route Selection Cards */}
        {allRoutes.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-0.5">
            {allRoutes.map((r, idx) => {
              const isSelected = idx === selectedRouteIndex;
              const fastestSec = Math.min(...allRoutes.map((x) => x.duration));
              const diffSec = r.duration - fastestSec;

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
                      {diffSec === 0 ? '✦ FASTEST' : `✦ OPTION ${idx + 1}`}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-[#d3bc8e]" />}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-extrabold text-[#f7f4ee] font-cinzel">{formatDuration(r.duration)}</span>
                    {diffSec > 0 && (
                      <span className="text-[10px] text-amber-400">+{Math.round(diffSec / 60)}m</span>
                    )}
                  </div>

                  {/* Toll & Traffic Badges */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-semibold ${r.hasTolls ? 'text-amber-400' : 'text-[#5ce1e6]'}`}>
                      {r.hasTolls ? r.tollFareEstimate : 'Toll-free'}
                    </span>
                    {r.trafficDelaySec > 0 ? (
                      <span className="text-[9px] text-rose-400 font-bold">+{Math.round(r.trafficDelaySec / 60)}m jam</span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold">🟢 Clear</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Selected Route Summary & GO Button */}
        {activeRoute && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#f7f4ee] font-cinzel leading-none">
                  {formatDuration(activeRoute.duration)}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  activeRoute.hasTolls
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#5ce1e6]/20 text-[#5ce1e6] border-[#5ce1e6]/40'
                }`}>
                  {activeRoute.hasTolls ? `Toll: ${activeRoute.tollFareEstimate}` : 'Toll-Free ✦'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#ede8db]/70 mt-1">
                <span>{formatDist(activeRoute.distance)}</span>
                <span>•</span>
                <span>Arrive at {arrivalTime(activeRoute.duration)}</span>
                {activeRoute.trafficDelaySec > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">Includes +{Math.round(activeRoute.trafficDelaySec / 60)}m traffic delay</span>
                  </>
                )}
              </div>
            </div>

            {/* Golden Start Journey Button */}
            <button
              onClick={onStartNavigation}
              className="gold-btn flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-sm active:scale-95 transition-all shrink-0"
            >
              <Navigation2 className="w-4 h-4 fill-current" />
              <span className="font-cinzel tracking-wider">NAVIGATE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
