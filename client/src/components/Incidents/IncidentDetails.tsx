import { ThumbsUp, ThumbsDown, X, Clock } from 'lucide-react';
import type { Incident } from '../../types/navigation';

interface IncidentDetailsProps {
  incident: Incident;
  onClose: () => void;
  onVote: (id: string, vote: 'up' | 'down') => void;
}

export function IncidentDetails({ incident, onClose, onVote }: IncidentDetailsProps) {
  const timeAgo = (timestamp: number) => {
    const elapsedMins = Math.round((Date.now() - timestamp) / 60000);
    if (elapsedMins < 1) return 'Just now';
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const hrs = Math.floor(elapsedMins / 60);
    return `${hrs}h ago`;
  };

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
    <div className="absolute bottom-28 left-3 right-3 z-40 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getEmoji(incident.type)}</span>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white leading-tight">{incident.title}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Reported {timeAgo(incident.reported_at)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {incident.description && (
          <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            {incident.description}
          </p>
        )}

        {/* Upvote / Downvote Confirmation Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onVote(incident.id, 'up')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span>Still there ({incident.upvotes})</span>
          </button>

          <button
            onClick={() => onVote(incident.id, 'down')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 text-xs font-bold transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Cleared ({incident.downvotes})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
