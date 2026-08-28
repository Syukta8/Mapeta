import { useState, useMemo } from 'react';
import { Car, Bike, Footprints, Navigation2, X, Clock, DollarSign, ShieldAlert, Check, Info } from 'lucide-react';
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
  const [showTollBreakdown, setShowTollBreakdown] = useState<boolean>(false);

  const sortedRoutes = useMemo(() => {
    const list = [...allRoutes];
    if (sortFilter === 'fastest') {
      return list.sort((a, b) => a.duration - b.duration);
    } else if (sortFilter === 'toll') {
      return list.sort((a, b) => {
        if (a.hasTolls !== b.hasTolls) return a.hasTolls ? 1 : -1;
        if (a.tollTotal !== b.tollTotal) return a.tollTotal - b.tollTotal;
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
      <div className="pixel-card rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 border border-white/10">
        {/* Top Profile Picker & Close Button */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#212226] border border-white/5 rounded-2xl">
            <button
              onClick={() => onSelectProfile('driving')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProfile === 'driving'
                  ? 'bg-[#a8c7fa] text-[#042f66] shadow-sm'
                  : 'text-[#e3e2e6]/70 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive</span>
            </button>
            <button
              onClick={() => onSelectProfile('bike')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProfile === 'bike'
                  ? 'bg-[#a8c7fa] text-[#042f66] shadow-sm'
                  : 'text-[#e3e2e6]/70 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bike</span>
            </button>
            <button
              onClick={() => onSelectProfile('foot')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedProfile === 'foot'
                  ? 'bg-[#a8c7fa] text-[#042f66] shadow-sm'
                  : 'text-[#e3e2e6]/70 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#212226] text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Route Sorting Matrix Tabs */}
        {selectedProfile === 'driving' && allRoutes.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-[#212226]/80 border border-white/5 rounded-2xl">
            <button
              onClick={() => {
                setSortFilter('fastest');
                const bestIdx = allRoutes.findIndex((r) => r.id === sortedRoutes[0]?.id);
                if (bestIdx >= 0) onSelectRouteIndex(bestIdx);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortFilter === 'fastest'
                  ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortFilter === 'toll'
                  ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sortFilter === 'traffic'
                  ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#a8c7fa]/20 border-[#a8c7fa] shadow-md shadow-[#a8c7fa]/10'
                      : 'bg-[#212226]/80 border-white/5 hover:border-white/20 opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-[#a8c7fa]' : 'text-slate-400'}`}>
                      {diffSec === 0 ? 'Best Route' : `Option ${idx + 1}`}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-[#a8c7fa]" />}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-white">{formatDuration(r.duration)}</span>
                    {diffSec > 0 && (
                      <span className="text-[10px] text-amber-400">+{Math.round(diffSec / 60)}m</span>
                    )}
                  </div>

                  {/* Toll & Traffic Badges */}
                  <div className="flex items-center justify-between text-[10px] mt-0.5">
                    <span className={`font-semibold ${r.hasTolls ? 'text-amber-300' : 'text-emerald-400'}`}>
                      {r.hasTolls ? r.tollFareEstimate : 'Toll-free'}
                    </span>
                    {r.trafficDelaySec > 0 ? (
                      <span className="text-[9px] text-red-400 font-bold">+{Math.round(r.trafficDelaySec / 60)}m jam</span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold">🟢 Clear</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* LLM Toll Breakdown Modal / Drawer */}
        {showTollBreakdown && activeRoute && activeRoute.tollBreakdown.length > 0 && (
          <div className="p-3 bg-[#212226] rounded-2xl border border-[#a8c7fa]/30 flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#a8c7fa]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">LLM Gazetted Toll Breakdown</span>
              </div>
              <button
                onClick={() => setShowTollBreakdown(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {activeRoute.tollBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#e3e2e6]">{item.expressway}</span>
                    <span className="text-[10px] text-slate-400">
                      {item.type === 'closed' ? `Distance: ${item.distanceKm} km (Closed Toll)` : 'Open Gantry Toll'}
                    </span>
                  </div>
                  <span className="font-bold text-amber-300">RM {item.fare.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-xs font-bold">
              <span className="text-slate-300">Total Toll (Class 1 Car):</span>
              <span className="text-[#a8c7fa] text-sm">RM {activeRoute.tollTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Primary Selected Route Summary & GO Button */}
        {activeRoute && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white leading-none">
                  {formatDuration(activeRoute.duration)}
                </span>

                {/* Clickable LLM Toll Pill Badge */}
                <button
                  onClick={() => setShowTollBreakdown(!showTollBreakdown)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full transition-all active:scale-95 ${
                    activeRoute.hasTolls
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                  title="Click to view LLM Toll Breakdown"
                >
                  <span>{activeRoute.hasTolls ? `Toll: ${activeRoute.tollFareEstimate}` : 'Toll-Free'}</span>
                  {activeRoute.hasTolls && <Info className="w-3 h-3 text-amber-400" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
                <span>{formatDist(activeRoute.distance)}</span>
                <span>•</span>
                <span>Arrive at {arrivalTime(activeRoute.duration)}</span>
                {activeRoute.trafficDelaySec > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">+{Math.round(activeRoute.trafficDelaySec / 60)}m jam</span>
                  </>
                )}
              </div>
            </div>

            {/* Pixel Blue Start Navigation Button */}
            <button
              onClick={onStartNavigation}
              className="pixel-btn-primary flex items-center gap-2 px-6 py-3.5 rounded-2xl active:scale-95 transition-all shrink-0"
            >
              <Navigation2 className="w-4 h-4 fill-current" />
              <span className="tracking-wide">Start</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
