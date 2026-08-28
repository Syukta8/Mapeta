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
      className={`relative cursor-pointer select-none rounded-2xl p-3 glass-genshin shadow-2xl transition-all flex items-center gap-3 ${
        isOverSpeed
          ? 'border-rose-500/80 shadow-rose-500/30'
          : 'border-[#d3bc8e]/40 hover:border-[#d3bc8e]'
      }`}
      title="Toggle KM/H / MPH"
    >
      <div className="flex flex-col items-center justify-center min-w-[56px]">
        <span className={`text-3xl font-extrabold tracking-tighter leading-none font-cinzel ${
          isOverSpeed ? 'text-rose-400' : 'text-[#f7f4ee]'
        }`}>
          {displaySpeed}
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[#d3bc8e] mt-0.5">{unit}</span>
      </div>

      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ede8db] border-2 border-rose-600 shadow-md">
        <span className="text-xs font-black text-[#0c1322] leading-none font-cinzel">{displayLimit}</span>
      </div>
    </div>
  );
}
