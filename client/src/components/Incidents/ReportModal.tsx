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

  const categories: { type: Incident['type']; label: string; icon: any; color: string; desc: string }[] = [
    {
      type: 'police',
      label: 'Police / Radar',
      icon: Shield,
      color: 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30',
      desc: 'Speed camera or patrol car',
    },
    {
      type: 'hazard',
      label: 'Hazard',
      icon: AlertTriangle,
      color: 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/30',
      desc: 'Object, pothole, or animal on road',
    },
    {
      type: 'jam',
      label: 'Traffic Jam',
      icon: Car,
      color: 'bg-rose-600 border-rose-400 text-white shadow-rose-500/30',
      desc: 'Heavy standstill traffic',
    },
    {
      type: 'closure',
      label: 'Road Closure',
      icon: Construction,
      color: 'bg-purple-600 border-purple-400 text-white shadow-purple-500/30',
      desc: 'Construction or blocked lane',
    },
    {
      type: 'accident',
      label: 'Accident',
      icon: Flame,
      color: 'bg-orange-600 border-orange-400 text-white shadow-orange-500/30',
      desc: 'Crash or vehicle breakdown',
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-base font-bold text-white">Report Road Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick-Select Category Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => setSelectedType(cat.type)}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1.5 transition-all text-left ${
                  isSelected
                    ? `${cat.color} shadow-lg scale-[1.02]`
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{cat.label}</span>
                </div>
                <span className={`text-[10px] leading-tight ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional Note / Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Additional Note (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Right lane blocked, patrol with camera"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Submit Report Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !userCoords}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 active:scale-98 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast to Mapeta Community'}</span>
        </button>
      </div>
    </div>
  );
}
