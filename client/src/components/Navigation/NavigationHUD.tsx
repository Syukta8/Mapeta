import { ArrowUp, ArrowRight, ArrowLeft, ArrowUpRight, ArrowUpLeft, RotateCcw, X, Layers, RefreshCw, CornerUpRight } from 'lucide-react';
import type { RouteStep, RouteInfo } from '../../types/navigation';

interface NavigationHUDProps {
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  nextNextStep?: RouteStep | null;
  distanceToNextStep: number;
  stepInitialDistance?: number;
  remainingDistance: number;
  remainingDuration: number;
  currentSpeedKmh: number;
  allRoutes?: RouteInfo[];
  selectedRouteIndex?: number;
  isRerouting?: boolean;
  onSelectRouteIndex?: (index: number) => void;
  onStopNavigation: () => void;
}

export function NavigationHUD({
  currentStep,
  nextStep,
  nextNextStep,
  distanceToNextStep,
  stepInitialDistance = 200,
  remainingDistance,
  remainingDuration,
  currentSpeedKmh,
  allRoutes = [],
  selectedRouteIndex = 0,
  isRerouting = false,
  onSelectRouteIndex,
  onStopNavigation,
}: NavigationHUDProps) {
  const getManeuverIcon = (type: string, modifier?: string) => {
    if (type === 'arrive') return <ArrowUp className="w-8 h-8 text-emerald-400" />;
    if (modifier?.includes('slight right')) return <ArrowUpRight className="w-8 h-8 text-white" />;
    if (modifier?.includes('slight left')) return <ArrowUpLeft className="w-8 h-8 text-white" />;
    if (modifier?.includes('right')) return <ArrowRight className="w-8 h-8 text-white" />;
    if (modifier?.includes('left')) return <ArrowLeft className="w-8 h-8 text-white" />;
    if (modifier?.includes('uturn')) return <RotateCcw className="w-8 h-8 text-white" />;
    return <ArrowUp className="w-8 h-8 text-white" />;
  };

  const formatDistance = (meters: number) => {
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

  // Calculate approach progress (0% -> 100% as you reach 0 meters)
  const progressPercent = Math.max(0, Math.min(100, (1 - distanceToNextStep / Math.max(100, stepInitialDistance)) * 100));

  return (
    <div className="absolute inset-x-0 top-0 z-30 pointer-events-none flex flex-col items-center p-3 sm:p-4 gap-2.5 max-w-xl mx-auto">
      
      {/* 🔄 Recalculating Route Visual Banner */}
      {isRerouting && (
        <div className="w-full bg-[#1b1c20]/98 backdrop-blur-xl border border-amber-400/50 rounded-2xl p-3 shadow-2xl flex items-center justify-center gap-2.5 animate-pulse text-amber-300 pointer-events-auto">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span className="text-xs font-black tracking-wide uppercase">Recalculating Fastest Route...</span>
        </div>
      )}

      {/* Top Turn Maneuver Card */}
      <div className="w-full pixel-card rounded-3xl p-4 shadow-2xl flex flex-col border border-white/10 pointer-events-auto bg-[#1b1c20]/95 backdrop-blur-xl relative overflow-hidden">
        
        {/* Dynamic Approach Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#0b57d0] to-[#6dd58c] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#0b57d0] border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              {getManeuverIcon(currentStep?.maneuverType || 'straight', currentStep?.modifier)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                {formatDistance(distanceToNextStep)}
              </span>
              <span className="text-xs font-bold text-slate-200 leading-snug truncate mt-1">
                {currentStep?.instruction || 'Follow road'}
              </span>
              {nextStep && (
                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                  Then {nextStep.instruction}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onStopNavigation}
            className="p-2.5 rounded-full bg-[#212226] text-slate-400 hover:text-white border border-white/10 active:scale-95 transition-all shadow-md shrink-0 ml-2"
            title="Exit Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Upcoming Maneuver Pill (If available) */}
        {nextNextStep && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <CornerUpRight className="w-3 h-3 text-[#a8c7fa]" />
            <span className="truncate">After that: {nextNextStep.instruction}</span>
          </div>
        )}
      </div>

      {/* In-Navigation Multi-Route Switcher */}
      {allRoutes.length > 1 && (
        <div className="w-full pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#121316]/90 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-400 shrink-0 shadow-md">
            <Layers className="w-3 h-3 text-[#a8c7fa]" />
            <span>Routes</span>
          </div>
          {allRoutes.map((r, idx) => {
            const isSelected = idx === selectedRouteIndex;
            return (
              <button
                key={idx}
                onClick={() => onSelectRouteIndex && onSelectRouteIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 shadow-md ${
                  isSelected
                    ? 'bg-[#0b57d0] text-white border border-white/30 shadow-[#0b57d0]/40'
                    : 'bg-[#1b1c20]/90 text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                <span>{Math.round(r.duration / 60)} min</span>
                {r.hasTolls && (
                  <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'}`}>
                    RM {r.tollTotal.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Floating Stats Pill */}
      <div className="fixed bottom-4 inset-x-4 max-w-sm mx-auto pixel-card rounded-full p-2.5 px-5 shadow-2xl flex items-center justify-between border border-white/10 pointer-events-auto bg-[#1b1c20]/95 backdrop-blur-xl">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Speed</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-white">{currentSpeedKmh}</span>
            <span className="text-[10px] font-bold text-slate-400">km/h</span>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-white/10"></div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Remaining</span>
          <span className="text-sm font-black text-white">{formatDistance(remainingDistance)}</span>
        </div>

        <div className="h-7 w-[1px] bg-white/10"></div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">ETA</span>
          <span className="text-sm font-black text-emerald-400">{formatDuration(remainingDuration)}</span>
        </div>
      </div>
    </div>
  );
}
