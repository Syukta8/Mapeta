import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import type { Incident } from '../../models/IncidentModel';

interface IncidentApproachAlertProps {
  incident: Incident;
  onVote: (id: string, vote: 'up' | 'down') => void;
  onDismiss: () => void;
}

export function IncidentApproachAlert({ incident, onVote, onDismiss }: IncidentApproachAlertProps) {
  const getEmoji = (type: Incident['type']) => {
    switch (type) {
      case 'police': return '👮';
      case 'hazard': return '⚠️';
      case 'jam': return '🚗';
      case 'closure': return '🚧';
      case 'accident': return '💥';
      default: return '📍';
    }
  };

  return (
    <div className="absolute top-24 left-3 right-3 z-40 max-w-sm mx-auto animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="pixel-card rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border-2 border-amber-400/80 bg-[#1b1c20]/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">{getEmoji(incident.type)}</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Alert Ahead</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">{incident.title}</h3>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-full bg-[#212226] text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
          <span className="font-semibold text-slate-300">Still there?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(incident.id, 'up')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold transition-all active:scale-95"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Yes ({incident.upvotes})</span>
            </button>
            <button
              onClick={() => onVote(incident.id, 'down')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 font-bold transition-all active:scale-95"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Not there</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
