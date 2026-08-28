import { useState } from 'react';

interface SpeedometerProps {
  currentSpeedKmh: number;
  speedLimit?: number;
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
      className={`relative cursor-pointer select-none rounded-3xl p-3 pixel-card shadow-2xl transition-all flex items-center gap-3 ${
        isOverSpeed
          ? 'border-red-400/80 shadow-red-500/20'
          : 'border-white/10 hover:border-[#a8c7fa]/50'
      }`}
      title="Toggle KM/H / MPH"
    >
      <div className="flex flex-col items-center justify-center min-w-[54px]">
        <span className={`text-3xl font-extrabold tracking-tight leading-none ${
          isOverSpeed ? 'text-red-400' : 'text-[#fdfcff]'
        }`}>
          {displaySpeed}
        </span>
        <span className="text-[9px] font-bold tracking-wider text-[#a8c7fa] mt-1">{unit}</span>
      </div>

      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-red-500 shadow-sm">
        <span className="text-xs font-black text-[#121316] leading-none">{displayLimit}</span>
      </div>
    </div>
  );
}
