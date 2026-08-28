import { useState } from 'react';
import { Volume2, VolumeX, X, Route, Check } from 'lucide-react';
import { ManeuverIcon } from './ManeuverIcon';
import { Speedometer } from './Speedometer';
import { voiceEngine } from './VoiceEngine';
import type { RouteStep, RouteInfo } from '../../types/navigation';

interface NavigationHUDProps {
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  distanceToNextStep: number;
  remainingDistance: number;
  remainingDuration: number;
  currentSpeedKmh: number;
  allRoutes: RouteInfo[];
  selectedRouteIndex: number;
  onSelectRouteIndex: (idx: number) => void;
  onStopNavigation: () => void;
}

export function NavigationHUD({
  currentStep,
  nextStep,
  distanceToNextStep,
  remainingDistance,
  remainingDuration,
  currentSpeedKmh,
  allRoutes,
  selectedRouteIndex,
  onSelectRouteIndex,
  onStopNavigation,
}: NavigationHUDProps) {
  const [isMuted, setIsMuted] = useState<boolean>(voiceEngine.getMuted());
  const [isRoutePickerOpen, setIsRoutePickerOpen] = useState<boolean>(false);

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    voiceEngine.setMuted(nextState);
  };

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

  const arrivalTime = new Date(Date.now() + remainingDuration * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* Top Driving Turn Banner (Material You Pixel Style) */}
      <div className="absolute top-3 left-3 right-3 z-40 flex flex-col gap-2 max-w-lg mx-auto">
        <div className="pixel-card rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-13 h-13 p-2.5 rounded-2xl bg-[#0b57d0] text-white flex items-center justify-center shadow-md shrink-0">
              <ManeuverIcon
                type={currentStep?.maneuverType || 'straight'}
                modifier={currentStep?.modifier}
                className="w-7 h-7 stroke-[2.5]"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white leading-none">
                  {formatDist(distanceToNextStep)}
                </span>
                <span className="text-[11px] text-[#a8c7fa] font-bold tracking-wide uppercase">• In</span>
              </div>
              <p className="text-sm font-semibold text-[#e3e2e6] truncate mt-1">
                {currentStep?.instruction || 'Continue on current route'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {allRoutes.length > 1 && (
              <button
                onClick={() => setIsRoutePickerOpen(!isRoutePickerOpen)}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isRoutePickerOpen
                    ? 'bg-[#a8c7fa] text-[#042f66] border-[#a8c7fa]'
                    : 'bg-[#212226] border-white/10 text-[#a8c7fa] hover:bg-[#2b2c31]'
                }`}
                title="Change Route Alternative"
              >
                <Route className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-[#212226] border-white/10 text-slate-400'
                  : 'bg-[#a8c7fa]/20 border-[#a8c7fa]/50 text-[#a8c7fa]'
              }`}
              title={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {nextStep && (
          <div className="pixel-card-subtle px-4 py-2 rounded-2xl flex items-center gap-2 text-xs text-[#a8c7fa] mx-2 shadow-lg border border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Then</span>
            <ManeuverIcon type={nextStep.maneuverType} modifier={nextStep.modifier} className="w-3.5 h-3.5 text-white" />
            <span className="truncate text-white font-medium text-[11px]">{nextStep.instruction}</span>
          </div>
        )}
      </div>

      {/* Floating Speedometer */}
      <div className="absolute left-3 bottom-24 z-30">
        <Speedometer currentSpeedKmh={currentSpeedKmh} />
      </div>

      {/* In-Navigation Route Switcher Bottom Sheet */}
      {isRoutePickerOpen && (
        <div className="absolute bottom-24 left-3 right-3 z-40 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="pixel-card rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-[#a8c7fa]/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[#a8c7fa]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Switch Route Alternative</span>
              </div>
              <button
                onClick={() => setIsRoutePickerOpen(false)}
                className="p-1 rounded-full bg-[#212226] text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {allRoutes.map((r, idx) => {
                const isSelected = idx === selectedRouteIndex;
                const diffSec = r.duration - allRoutes[0].duration;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectRouteIndex(idx);
                      setIsRoutePickerOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#a8c7fa]/20 border-[#a8c7fa] text-white shadow-md'
                        : 'bg-[#212226]/80 border-white/5 text-slate-300 hover:bg-[#2b2c31]'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{formatDuration(r.duration)}</span>
                        {diffSec > 0 && <span className="text-xs text-amber-400">+{Math.round(diffSec / 60)}m</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.hasTolls ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {r.hasTolls ? r.tollFareEstimate : 'Toll-free'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate max-w-[220px]">{r.summary}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#a8c7fa]">
                          <Check className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#a8c7fa] bg-[#a8c7fa]/10 px-3 py-1 rounded-full">
                          Switch
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom ETA Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
        <div className="pixel-card rounded-3xl p-4 shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#a8c7fa] leading-none">
                  {formatDuration(remainingDuration)}
                </span>
                <span className="text-xs font-semibold text-[#e3e2e6]">ETA {arrivalTime}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mt-1">
                <span>{formatDist(remainingDistance)} remaining</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStopNavigation}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-600 hover:text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>End Trip</span>
          </button>
        </div>
      </div>
    </>
  );
}
