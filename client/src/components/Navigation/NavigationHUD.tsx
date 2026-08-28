import { useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { ManeuverIcon } from './ManeuverIcon';
import { Speedometer } from './Speedometer';
import { voiceEngine } from './VoiceEngine';
import type { RouteStep } from '../../types/navigation';

interface NavigationHUDProps {
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  distanceToNextStep: number;
  remainingDistance: number;
  remainingDuration: number;
  currentSpeedKmh: number;
  onStopNavigation: () => void;
}

export function NavigationHUD({
  currentStep,
  nextStep,
  distanceToNextStep,
  remainingDistance,
  remainingDuration,
  currentSpeedKmh,
  onStopNavigation,
}: NavigationHUDProps) {
  const [isMuted, setIsMuted] = useState<boolean>(voiceEngine.getMuted());

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    voiceEngine.setMuted(nextState);
  };

  // Format distance
  const formatDist = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Format remaining duration
  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs} hr ${remMins} min`;
    }
    return `${mins} min`;
  };

  // Estimated Arrival Time
  const arrivalTime = new Date(Date.now() + remainingDuration * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* Top Maneuver Card */}
      <div className="absolute top-3 left-3 right-3 z-40 flex flex-col gap-2 max-w-lg mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-sky-500/30 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Maneuver Big Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
              <ManeuverIcon
                type={currentStep?.maneuverType || 'straight'}
                modifier={currentStep?.modifier}
                className="w-9 h-9 text-white stroke-[2.5]"
              />
            </div>

            {/* Distance & Street Instruction */}
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-black text-white tracking-tight leading-none">
                {formatDist(distanceToNextStep)}
              </span>
              <p className="text-sm font-semibold text-slate-200 truncate mt-1">
                {currentStep?.instruction || 'Continue straight'}
              </p>
            </div>
          </div>

          {/* Voice Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              isMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
            }`}
            title={isMuted ? 'Unmute voice guidance' : 'Mute voice guidance'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Next Maneuver Preview Sub-bar */}
        {nextStep && (
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs text-slate-400 mx-2 shadow-lg">
            <span>Then</span>
            <ManeuverIcon type={nextStep.maneuverType} modifier={nextStep.modifier} className="w-3.5 h-3.5 text-slate-300" />
            <span className="truncate text-slate-300 font-medium">{nextStep.instruction}</span>
          </div>
        )}
      </div>

      {/* Floating Speedometer (Bottom Left) */}
      <div className="absolute left-4 bottom-24 z-30">
        <Speedometer currentSpeedKmh={currentSpeedKmh} />
      </div>

      {/* Bottom ETA & Trip Summary Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-emerald-400 leading-none">
                {formatDuration(remainingDuration)}
              </span>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 mt-1">
                <span>{formatDist(remainingDistance)}</span>
                <span>•</span>
                <span className="text-slate-200">ETA {arrivalTime}</span>
              </div>
            </div>
          </div>

          {/* End Navigation Button */}
          <button
            onClick={onStopNavigation}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-xs shadow-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>End</span>
          </button>
        </div>
      </div>
    </>
  );
}
