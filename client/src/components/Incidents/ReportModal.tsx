import { useState, useEffect, useRef } from 'react';
import { X, Send, Clock } from 'lucide-react';
import { WAZE_INCIDENT_CATEGORIES, type IncidentType, type CreateIncidentPayload } from '../../models/IncidentModel';

interface ReportModalProps {
  userCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (payload: CreateIncidentPayload) => Promise<void>;
}

export function ReportModal({ userCoords, onClose, onSubmit }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<IncidentType>('police');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('Speed Trap');
  const [description, setDescription] = useState('');
  const [countdown, setCountdown] = useState<number>(5);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countdownTimerRef = useRef<number | null>(null);

  const activeCategory = WAZE_INCIDENT_CATEGORIES.find((c) => c.type === selectedType) || WAZE_INCIDENT_CATEGORIES[0];

  // Auto-send countdown timer (5 seconds safe hands-free dispatch)
  useEffect(() => {
    if (!isCountingDown) return;

    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          handleDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isCountingDown, selectedType, selectedSubtype, description, userCoords]);

  const handleSelectCategory = (type: IncidentType) => {
    const cat = WAZE_INCIDENT_CATEGORIES.find((c) => c.type === type);
    setSelectedType(type);
    if (cat && cat.subtypes.length > 0) {
      setSelectedSubtype(cat.subtypes[0]);
    }
    setCountdown(5); // Reset countdown on new category
    setIsCountingDown(true);
  };

  const handleDispatch = async () => {
    if (!userCoords || isSubmitting) return;

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setIsSubmitting(true);

    try {
      await onSubmit({
        type: selectedType,
        subtype: selectedSubtype,
        lat: userCoords.latitude,
        lng: userCoords.longitude,
        title: `${activeCategory.emoji} ${activeCategory.label}: ${selectedSubtype}`,
        description: description.trim() || undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md pixel-card rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/10 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header & 5-Second Countdown Indicator */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">Report Incident</span>
            <div className="flex items-center gap-1 bg-[#a8c7fa]/20 text-[#a8c7fa] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#a8c7fa]/30">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Sending in {countdown}s</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#212226] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Second Auto-Send Progress Bar */}
        <div className="w-full bg-[#212226] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#a8c7fa] h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>

        {/* Waze-Style Big Category Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {WAZE_INCIDENT_CATEGORIES.map((cat) => {
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => handleSelectCategory(cat.type)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isSelected
                    ? 'bg-[#a8c7fa] text-[#042f66] border-[#a8c7fa] shadow-lg scale-105 font-bold'
                    : 'bg-[#212226] border-white/5 text-slate-300 hover:bg-[#2b2c31]'
                }`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-bold leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Pills */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subcategory</span>
          <div className="flex flex-wrap gap-1.5">
            {activeCategory.subtypes.map((sub) => {
              const isSubSelected = selectedSubtype === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubtype(sub);
                    setIsCountingDown(false); // Pause auto-send if user is customizing
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSubSelected
                      ? 'bg-white text-[#121316] border-white shadow-sm'
                      : 'bg-[#212226] text-slate-300 border-white/5 hover:bg-[#2b2c31]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Custom Note */}
        <input
          type="text"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setIsCountingDown(false); // Pause auto-send on typing
          }}
          placeholder="Optional notes (e.g. Left lane blocked)"
          className="w-full bg-[#212226] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a8c7fa]"
        />

        {/* Immediate Send / Cancel Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-[#212226] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDispatch}
            disabled={isSubmitting || !userCoords}
            className="flex-2 pixel-btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold tracking-wide active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Sending...' : 'Send Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
