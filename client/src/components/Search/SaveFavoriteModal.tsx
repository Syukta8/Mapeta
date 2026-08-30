import { useState } from 'react';
import { X, Home, Briefcase, Coffee, ShoppingBag, Star, BookmarkCheck } from 'lucide-react';
import type { FavoriteType } from '../../models/FavoriteModel';

interface SaveFavoriteModalProps {
  target: { lat: number; lng: number; name?: string; address?: string } | null;
  onClose: () => void;
  onSave: (name: string, type: FavoriteType) => Promise<void>;
}

export function SaveFavoriteModal({ target, onClose, onSave }: SaveFavoriteModalProps) {
  const [name, setName] = useState(target?.name || 'My Favorite Place');
  const [type, setType] = useState<FavoriteType>('custom');
  const [isSaving, setIsSaving] = useState(false);

  const categories: { type: FavoriteType; label: string; icon: any; color: string }[] = [
    { type: 'home', label: 'Home', icon: Home, color: 'text-[#a8c7fa]' },
    { type: 'work', label: 'Work', icon: Briefcase, color: 'text-amber-300' },
    { type: 'cafe', label: 'Cafe', icon: Coffee, color: 'text-orange-300' },
    { type: 'store', label: 'Store', icon: ShoppingBag, color: 'text-emerald-300' },
    { type: 'custom', label: 'Star', icon: Star, color: 'text-yellow-300' },
  ];

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(name.trim(), type);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm pixel-card rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-[#a8c7fa]" />
            <span className="text-sm font-bold text-white tracking-wide">Save as Favorite</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Type Picker */}
        <div className="grid grid-cols-5 gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = type === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => {
                  setType(cat.type);
                  if (cat.type === 'home') setName('Home');
                  if (cat.type === 'work') setName('Work');
                }}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-[#a8c7fa]/20 border-[#a8c7fa] text-white shadow-md'
                    : 'bg-[#212226] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-[10px] font-bold">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Place Name Input */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Place Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home, Office, Starbucks Subang"
            className="w-full bg-[#212226] border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a8c7fa]"
          />
        </div>

        {/* Coordinates Summary */}
        {target && (
          <div className="p-2.5 bg-[#212226] rounded-xl border border-white/5 text-[10px] text-slate-400 flex flex-col gap-0.5">
            <span className="font-semibold text-slate-300 truncate">{target.address || 'Selected Location'}</span>
            <span>{target.lat.toFixed(5)}, {target.lng.toFixed(5)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-[#212226] border border-white/10 text-slate-300 hover:text-white text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="flex-2 pixel-btn-primary py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Place'}
          </button>
        </div>
      </div>
    </div>
  );
}
