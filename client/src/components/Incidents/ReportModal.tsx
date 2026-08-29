import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Clock } from 'lucide-react';
import { WAZE_INCIDENT_CATEGORIES, type CreateIncidentPayload, type WazeCategory } from '../../models/IncidentModel';

interface ReportModalProps {
  userCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (payload: CreateIncidentPayload) => Promise<void>;
}

export function ReportModal({ userCoords, onClose, onSubmit }: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<WazeCategory | null>(null);
  const [countdown, setCountdown] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoDispatchTimerRef = useRef<number | null>(null);

  // Auto-dispatch primary subtype if user selects category and doesn't tap subtype within 4s
  useEffect(() => {
    if (!selectedCategory) return;

    setCountdown(4);
    autoDispatchTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoDispatchTimerRef.current!);
          handleDispatch(selectedCategory.subtypes[0] || selectedCategory.label);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoDispatchTimerRef.current) clearInterval(autoDispatchTimerRef.current);
    };
  }, [selectedCategory]);

  const handleSelectCategory = (cat: WazeCategory) => {
    setSelectedCategory(cat);
  };

  const handleDispatch = async (subtype: string) => {
    if (!userCoords || !selectedCategory || isSubmitting) return;

    if (autoDispatchTimerRef.current) clearInterval(autoDispatchTimerRef.current);
    setIsSubmitting(true);

    try {
      await onSubmit({
        type: selectedCategory.type,
        subtype,
        lat: userCoords.latitude,
        lng: userCoords.longitude,
        title: `${selectedCategory.emoji} ${selectedCategory.label}: ${subtype}`,
      });
    } catch (err) {
      console.error('[ReportModal] Dispatch error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md pixel-card rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/10 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <button
                onClick={() => {
                  if (autoDispatchTimerRef.current) clearInterval(autoDispatchTimerRef.current);
                  setSelectedCategory(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Back to Categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-sm font-bold text-white tracking-wide">
              {selectedCategory ? `Report ${selectedCategory.label}` : 'Report Incident (2 Taps)'}
            </span>
          </div>

          {selectedCategory && (
            <div className="flex items-center gap-1 bg-[#a8c7fa]/20 text-[#a8c7fa] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#a8c7fa]/30">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Auto-send in {countdown}s</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#212226] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Tap Category (Large 5-tile Grid) */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1">
            {WAZE_INCIDENT_CATEGORIES.map((cat) => (
              <button
                key={cat.type}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className="p-4 rounded-2xl bg-[#212226] border border-white/10 hover:border-[#a8c7fa]/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 text-center shadow-lg group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span className="text-xs font-extrabold text-white leading-tight">{cat.label}</span>
                <span className="text-[10px] text-slate-400 leading-none truncate max-w-[120px]">{cat.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: Tap Subtype (Instant 1-Tap Dispatch) */}
        {selectedCategory && (
          <div className="flex flex-col gap-2 py-1 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Auto-Send Progress Bar */}
            <div className="w-full bg-[#212226] h-1.5 rounded-full overflow-hidden mb-1">
              <div
                className="bg-[#a8c7fa] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 4) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {selectedCategory.subtypes.map((sub, idx) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleDispatch(sub)}
                  disabled={isSubmitting}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-98 ${
                    idx === 0
                      ? 'bg-[#a8c7fa]/20 border-[#a8c7fa] text-white shadow-md'
                      : 'bg-[#212226] border-white/5 text-slate-200 hover:bg-[#2b2c31]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{selectedCategory.emoji}</span>
                    <span className="text-xs font-bold">{sub}</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/10 text-[#a8c7fa]">
                    Tap to send
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Cancel Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#212226] border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

