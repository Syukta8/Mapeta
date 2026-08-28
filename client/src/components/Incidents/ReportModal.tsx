import { useState } from 'react';
import { Shield, AlertTriangle, Car, Construction, Flame, X, Send } from 'lucide-react';
import type { Incident } from '../../types/navigation';

interface ReportModalProps {
  userCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (incident: Partial<Incident>) => Promise<void>;
}

export function ReportModal({ userCoords, onClose, onSubmit }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<Incident['type']>('police');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { type: Incident['type']; label: string; icon: any; desc: string; emoji: string }[] = [
    {
      type: 'police',
      label: 'Patrol / Camera',
      icon: Shield,
      desc: 'Speed radar or police unit',
      emoji: '👮',
    },
    {
      type: 'hazard',
      label: 'Road Hazard',
      icon: AlertTriangle,
      desc: 'Pothole, debris, or obstacle',
      emoji: '⚠️',
    },
    {
      type: 'jam',
      label: 'Traffic Jam',
      icon: Car,
      desc: 'Standstill congestion',
      emoji: '🚗',
    },
    {
      type: 'closure',
      label: 'Road Closure',
      icon: Construction,
      desc: 'Blocked path or work zone',
      emoji: '🚧',
    },
    {
      type: 'accident',
      label: 'Accident',
      icon: Flame,
      desc: 'Crash or vehicle breakdown',
      emoji: '💥',
    },
  ];

  const handleSubmit = async () => {
    if (!userCoords || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selected = categories.find((c) => c.type === selectedType);
      await onSubmit({
        type: selectedType,
        lat: userCoords.latitude,
        lng: userCoords.longitude,
        title: selected?.label || 'Incident reported',
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-[#0c1322]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-genshin rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#d3bc8e]/40 animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between border-b border-[#d3bc8e]/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[#d3bc8e] font-cinzel font-bold text-sm">✦ REPORT INCIDENT</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0c1322]/80 text-[#ede8db]/70 hover:text-[#f7f4ee] border border-[#d3bc8e]/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => setSelectedType(cat.type)}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all text-left ${
                  isSelected
                    ? 'bg-[#d3bc8e]/20 border-[#d3bc8e] text-[#f7f4ee] shadow-lg shadow-[#d3bc8e]/10'
                    : 'bg-[#0c1322]/60 border-[#d3bc8e]/20 text-[#ede8db]/70 hover:border-[#d3bc8e]/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-xs font-bold text-[#f7f4ee]">{cat.label}</span>
                </div>
                <span className="text-[10px] text-[#ede8db]/60 leading-tight">
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#d3bc8e]">Details (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Left lane blocked, heavy slow down"
            className="w-full bg-[#0c1322]/80 border border-[#d3bc8e]/30 rounded-xl px-3.5 py-2 text-xs text-[#f7f4ee] placeholder-[#ede8db]/40 focus:outline-none focus:border-[#d3bc8e] transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !userCoords}
          className="gold-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-xs tracking-wider font-cinzel active:scale-95 disabled:opacity-50 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'DISPATCHING...' : 'BROADCAST TO TRAVELERS'}</span>
        </button>
      </div>
    </div>
  );
}
