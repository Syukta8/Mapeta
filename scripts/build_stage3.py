import pathlib

maneuver_icon = """import { 
  ArrowUp, 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowRight, 
  ArrowLeft, 
  CornerUpRight, 
  CornerUpLeft, 
  RotateCw, 
  GitMerge, 
  Flag, 
  Compass, 
  RefreshCw 
} from 'lucide-react';
import type { ManeuverType } from '../../types/navigation';

interface ManeuverIconProps {
  type: ManeuverType;
  modifier?: string;
  className?: string;
}

export function ManeuverIcon({ type, modifier, className = 'w-8 h-8 text-white' }: ManeuverIconProps) {
  switch (type) {
    case 'turn-left':
      return <ArrowLeft className={className} />;
    case 'turn-right':
      return <ArrowRight className={className} />;
    case 'turn-slight-left':
      return <ArrowUpLeft className={className} />;
    case 'turn-slight-right':
      return <ArrowUpRight className={className} />;
    case 'turn-sharp-left':
      return <CornerUpLeft className={className} />;
    case 'turn-sharp-right':
      return <CornerUpRight className={className} />;
    case 'roundabout':
      return <RotateCw className={className} />;
    case 'merge':
    case 'on-ramp':
      return <GitMerge className={className} />;
    case 'u-turn':
      return <RefreshCw className={className} />;
    case 'arrive':
      return <Flag className={className} />;
    case 'straight':
    case 'depart':
    default:
      if (modifier?.includes('right')) return <ArrowUpRight className={className} />;
      if (modifier?.includes('left')) return <ArrowUpLeft className={className} />;
      return <ArrowUp className={className} />;
  }
}
"""

voice_engine = """class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      // Select natural English voice if available
      this.voice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Siri'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(text: string, force = false) {
    if (this.isMuted || !this.synth || !text) return;

    const now = Date.now();
    // Avoid repeating same speech within 8 seconds unless forced
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 8000) {
      return;
    }

    this.synth.cancel(); // Cancel previous ongoing utterance for timely navigation prompt

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    this.synth.speak(utterance);
  }
}

export const voiceEngine = new VoiceEngine();
"""

speedometer = """import { useState } from 'react';
import { Gauge } from 'lucide-react';

interface SpeedometerProps {
  currentSpeedKmh: number;
  speedLimit?: number; // default e.g. 60 or 90 km/h
}

export function Speedometer({ currentSpeedKmh, speedLimit = 80 }: SpeedometerProps) {
  const [useMph, setUseMph] = useState(false);

  const displaySpeed = useMph ? Math.round(currentSpeedKmh * 0.621371) : currentSpeedKmh;
  const displayLimit = useMph ? Math.round(speedLimit * 0.621371) : speedLimit;
  const unit = useMph ? 'MPH' : 'KM/H';

  const isOverSpeed = currentSpeedKmh > speedLimit;

  return (
    <div 
      onClick={() => setUseMph(!useMph)}
      className={`relative cursor-pointer select-none rounded-3xl p-3.5 backdrop-blur-xl border shadow-2xl transition-all flex items-center gap-3 ${
        isOverSpeed
          ? 'bg-rose-950/90 border-rose-500/80 shadow-rose-500/30 animate-pulse'
          : 'bg-slate-900/90 border-slate-800 shadow-slate-950/50'
      }`}
      title="Click to toggle KM/H / MPH"
    >
      {/* Speedometer Gauge & Number */}
      <div className="flex flex-col items-center justify-center min-w-[58px]">
        <span className={`text-3xl font-extrabold tracking-tighter leading-none ${
          isOverSpeed ? 'text-rose-400' : 'text-white'
        }`}>
          {displaySpeed}
        </span>
        <span className="text-[9px] font-bold tracking-wider text-slate-400 mt-0.5">{unit}</span>
      </div>

      {/* Speed Limit Circular Sign */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-[3px] border-rose-600 shadow-md">
        <span className="text-xs font-black text-slate-950 leading-none">{displayLimit}</span>
      </div>
    </div>
  );
}
"""

nav_hook = """import { useState, useEffect, useRef } from 'react';
import { voiceEngine } from '../components/Navigation/VoiceEngine';
import type { RouteInfo, RouteStep, ManeuverType } from '../types/navigation';

export function useNavigation(
  activeRoute: RouteInfo | null,
  userCoords: { latitude: number; longitude: number; heading: number | null } | null,
  isNavigating: boolean,
  onRerouteRequest?: () => void
) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [remainingDuration, setRemainingDuration] = useState<number>(0);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);

  const lastRerouteTime = useRef<number>(0);

  // Reset steps when a new route is loaded
  useEffect(() => {
    if (activeRoute) {
      setCurrentStepIndex(0);
      setRemainingDistance(activeRoute.distance);
      setRemainingDuration(activeRoute.duration);
      if (isNavigating && activeRoute.steps.length > 0) {
        voiceEngine.speak(`Starting navigation to destination. ${activeRoute.steps[0].instruction}`, true);
      }
    }
  }, [activeRoute, isNavigating]);

  // Track progress along route steps
  useEffect(() => {
    if (!isNavigating || !activeRoute || !userCoords || activeRoute.steps.length === 0) {
      return;
    }

    const currentStep = activeRoute.steps[currentStepIndex];
    if (!currentStep) return;

    // Calculate distance from user to current step waypoint
    const distToStep = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      currentStep.location[1],
      currentStep.location[0]
    );

    setDistanceToNextStep(Math.round(distToStep));

    // Voice announcement thresholds
    if (distToStep < 30) {
      // Advance to next step
      if (currentStepIndex < activeRoute.steps.length - 1) {
        const nextIdx = currentStepIndex + 1;
        setCurrentStepIndex(nextIdx);
        const nextStep = activeRoute.steps[nextIdx];
        voiceEngine.speak(nextStep.instruction, true);
      } else {
        voiceEngine.speak('You have arrived at your destination.', true);
      }
    } else if (distToStep <= 150 && distToStep > 120) {
      voiceEngine.speak(`In 150 meters, ${currentStep.instruction}`);
    } else if (distToStep <= 500 && distToStep > 450) {
      voiceEngine.speak(`In 500 meters, ${currentStep.instruction}`);
    }

    // Calculate total remaining distance
    let remDist = distToStep;
    for (let i = currentStepIndex + 1; i < activeRoute.steps.length; i++) {
      remDist += activeRoute.steps[i].distance;
    }
    setRemainingDistance(Math.round(remDist));

    // Estimate remaining time assuming average speed ~40 km/h
    const estimatedSeconds = Math.round((remDist / 1000) / 40 * 3600);
    setRemainingDuration(estimatedSeconds);

    // Cross-track off-route detection: if user is > 60m away from current step & path
    const now = Date.now();
    if (distToStep > 250 && currentStepIndex === 0 && now - lastRerouteTime.current > 15000) {
      lastRerouteTime.current = now;
      if (onRerouteRequest) {
        voiceEngine.speak('Rerouting, please wait.');
        onRerouteRequest();
      }
    }
  }, [userCoords, isNavigating, activeRoute, currentStepIndex, onRerouteRequest]);

  return {
    currentStep: activeRoute?.steps[currentStepIndex] || null,
    nextStep: activeRoute?.steps[currentStepIndex + 1] || null,
    currentStepIndex,
    distanceToNextStep,
    remainingDistance,
    remainingDuration,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) * Math.sin(dphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) * Math.sin(dlambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
"""

nav_hud = """import { useState } from 'react';
import { Volume2, VolumeX, X, Navigation as NavIcon, Clock, Milestones } from 'lucide-react';
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
"""

pathlib.Path('client/src/components/Navigation').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/components/Navigation/ManeuverIcon.tsx').write_text(maneuver_icon, encoding='utf-8')
pathlib.Path('client/src/components/Navigation/VoiceEngine.ts').write_text(voice_engine, encoding='utf-8')
pathlib.Path('client/src/components/Navigation/Speedometer.tsx').write_text(speedometer, encoding='utf-8')
pathlib.Path('client/src/hooks/useNavigation.ts').write_text(nav_hook, encoding='utf-8')
pathlib.Path('client/src/components/Navigation/NavigationHUD.tsx').write_text(nav_hud, encoding='utf-8')
print('Stage 3 Navigation components generated successfully!')