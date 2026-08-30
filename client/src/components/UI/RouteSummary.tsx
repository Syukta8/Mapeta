import { useState } from 'react';
import { Navigation, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { RouteInfo } from '../../types/navigation';
import type { TravelProfile } from '../../models/NavigationModel';

interface RouteSummaryProps {
  allRoutes: RouteInfo[];
  selectedRouteIndex: number;
  selectedProfile: TravelProfile;
  onSelectRouteIndex: (index: number) => void;
  onSelectProfile: (profile: TravelProfile) => void;
  onStartNavigation: () => void;
  onClose: () => void;
}

export function RouteSummary({
  allRoutes,
  selectedRouteIndex,
  onSelectRouteIndex,
  onStartNavigation,
  onClose,
}: RouteSummaryProps) {
  const [showTollDrawer, setShowTollDrawer] = useState(false);
  const activeRoute = allRoutes[selectedRouteIndex] || allRoutes[0];

  if (!activeRoute) return null;

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`;
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

  return (
    <div className="absolute bottom-3 inset-x-3 z-40 max-w-xl mx-auto flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
      
      {/* Route Cards Container */}
      <div className="pixel-card rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 border border-white/15 bg-[#1b1c20]/95 backdrop-blur-xl">
        
        {/* Route Cards Selector List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allRoutes.map((route, idx) => {
            const isSelected = idx === selectedRouteIndex;
            return (
              <button
                key={idx}
                onClick={() => onSelectRouteIndex(idx)}
                className={`flex flex-col text-left p-3 rounded-2xl border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#0b57d0]/20 border-[#a8c7fa] shadow-lg shadow-[#0b57d0]/20'
                    : 'bg-[#212226]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Route Type Badge */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-[#0b57d0] text-white' : 'bg-white/10 text-slate-300'
                  }`}>
                    {route.label || `Route ${idx + 1}`}
                  </span>
                </div>

                {/* Duration & Distance */}
                <span className="text-sm font-black text-white leading-tight">
                  {formatDuration(route.duration)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {formatDistance(route.distance)}
                </span>

                {/* Toll Tag */}
                <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[10px]">
                  {route.hasTolls ? (
                    <span className="text-amber-300 font-extrabold">RM {route.tollTotal.toFixed(2)}</span>
                  ) : (
                    <span className="text-emerald-400 font-extrabold">Toll-Free</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Route Info Strip */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#121316]/70 border border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[#a8c7fa] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-tight">{activeRoute.summary}</span>
              <span className="text-[10px] text-slate-400">
                {activeRoute.hasTolls ? `Highway with ${activeRoute.tollBreakdown.length} Tolls` : 'Federal Trunk Road (No Toll)'}
              </span>
            </div>
          </div>

          {activeRoute.hasTolls && (
            <button
              onClick={() => setShowTollDrawer(!showTollDrawer)}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0"
            >
              <span>RM {activeRoute.tollTotal.toFixed(2)}</span>
              {showTollDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Itemized Toll Breakdown Drawer */}
        {showTollDrawer && activeRoute.hasTolls && (
          <div className="p-3 rounded-2xl bg-[#121316] border border-amber-500/30 flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 border-b border-white/10 pb-1.5">
              <span>Highway Toll Breakdown</span>
              <span>Rate</span>
            </div>
            {activeRoute.tollBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-slate-300">{item.code}</span>
                  <span>{item.expressway}</span>
                </div>
                <span className="font-bold text-white">RM {item.fare.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-[#212226] hover:bg-white/10 text-slate-300 font-bold text-xs active:scale-95 transition-all border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onStartNavigation}
            className="flex-1 pixel-btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-lg"
          >
            <Navigation className="w-4 h-4 fill-current" />
            <span>Start Navigation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
