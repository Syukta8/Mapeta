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

  const arrivalTime = new Date(Date.now() + remainingDuration * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="absolute top-3 left-3 right-3 z-40 flex flex-col gap-2 max-w-lg mx-auto">
        <div className="glass-genshin rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border border-[#d3bc8e]/40">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 p-2 rounded-xl bg-gradient-to-br from-[#d3bc8e] to-[#94784a] text-[#0c1322] flex items-center justify-center shadow-lg shrink-0 border border-[#f7f4ee]/40">
              <ManeuverIcon
                type={currentStep?.maneuverType || 'straight'}
                modifier={currentStep?.modifier}
                className="w-7 h-7 stroke-[2.5]"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-[#f7f4ee] font-cinzel leading-none">
                  {formatDist(distanceToNextStep)}
                </span>
                <span className="text-[10px] text-[#d3bc8e] font-semibold tracking-wider uppercase">✦ Ahead</span>
              </div>
              <p className="text-xs font-semibold text-[#ede8db] truncate mt-1">
                {currentStep?.instruction || 'Continue on current route'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border transition-all shrink-0 ${
              isMuted
                ? 'bg-[#0c1322]/80 border-[#d3bc8e]/20 text-slate-400'
                : 'bg-[#d3bc8e]/20 border-[#d3bc8e]/50 text-[#d3bc8e]'
            }`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {nextStep && (
          <div className="glass-genshin-subtle px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs text-[#d3bc8e]/80 mx-2 shadow-lg border border-[#d3bc8e]/20">
            <span className="font-cinzel text-[10px] text-[#d3bc8e]">THEN</span>
            <ManeuverIcon type={nextStep.maneuverType} modifier={nextStep.modifier} className="w-3.5 h-3.5 text-[#ede8db]" />
            <span className="truncate text-[#ede8db] font-medium text-[11px]">{nextStep.instruction}</span>
          </div>
        )}
      </div>

      <div className="absolute left-3 bottom-24 z-30">
        <Speedometer currentSpeedKmh={currentSpeedKmh} />
      </div>

      <div className="absolute bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
        <div className="glass-genshin rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-[#d3bc8e]/40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#5ce1e6] font-cinzel leading-none">
                  {formatDuration(remainingDuration)}
                </span>
                <span className="text-xs font-semibold text-[#d3bc8e]">ETA {arrivalTime}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-[#ede8db]/70 mt-1">
                <span>{formatDist(remainingDistance)} remaining</span>
              </div>
            </div>
          </div>

          <button
            onClick={onStopNavigation}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-xs shadow-lg transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>End</span>
          </button>
        </div>
      </div>
    </>
  );
}
