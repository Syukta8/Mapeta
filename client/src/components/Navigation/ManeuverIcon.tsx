import { 
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
