import { Navigation2, Star, X, MapPin } from 'lucide-react';

interface PlaceInfoCardProps {
  place: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };
  onGetDirections: (coords: [number, number]) => void;
  onSaveFavorite: (lat: number, lng: number, name: string, address: string) => void;
  onClose: () => void;
}

export function PlaceInfoCard({ place, onGetDirections, onSaveFavorite, onClose }: PlaceInfoCardProps) {
  return (
    <div className="absolute bottom-4 left-3 right-3 z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="pixel-card rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 border border-white/15 bg-[#1b1c20]/95 backdrop-blur-xl">
        
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 mt-0.5 shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-black text-white leading-tight truncate">{place.name}</h2>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{place.address}</p>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">
                {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#212226] text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons (Google Maps Style) */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          {/* Directions / Route Button */}
          <button
            onClick={() => onGetDirections([place.lng, place.lat])}
            className="flex-1 pixel-btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-lg"
          >
            <Navigation2 className="w-4 h-4 fill-current" />
            <span>Directions</span>
          </button>

          {/* Save to Favorites Button */}
          <button
            onClick={() => onSaveFavorite(place.lat, place.lng, place.name, place.address)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-[#212226] border border-white/10 hover:border-yellow-400/40 text-yellow-300 hover:text-yellow-200 text-xs font-bold active:scale-95 transition-all shadow-md"
          >
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>Save Place</span>
          </button>
        </div>
      </div>
    </div>
  );
}
