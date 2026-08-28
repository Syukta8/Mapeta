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
      <div className="glass-genshin rounded-2xl p-4 shadow-2xl flex flex-col gap-3 border border-[#d3bc8e]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{getEmoji(incident.type)}</span>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-[#f7f4ee] font-cinzel leading-tight">{incident.title}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#d3bc8e] mt-0.5">
                <Clock className="w-3 h-3 text-[#d3bc8e]" />
                <span>Reported {timeAgo(incident.reported_at)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#0c1322]/80 text-[#ede8db]/70 hover:text-[#f7f4ee] border border-[#d3bc8e]/20"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {incident.description && (
          <p className="text-xs text-[#ede8db] bg-[#0c1322]/60 p-2.5 rounded-xl border border-[#d3bc8e]/20">
            {incident.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onVote(incident.id, 'up')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#5ce1e6]/15 border border-[#5ce1e6]/40 text-[#5ce1e6] hover:bg-[#5ce1e6]/25 text-xs font-bold transition-all"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Active ({incident.upvotes})</span>
          </button>

          <button
            onClick={() => onVote(incident.id, 'down')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0c1322]/80 border border-[#d3bc8e]/20 text-[#ede8db]/70 hover:text-rose-300 hover:border-rose-500/40 text-xs font-bold transition-all"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Cleared ({incident.downvotes})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
