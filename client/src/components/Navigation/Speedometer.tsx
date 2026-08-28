import { useState } from 'react';

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
