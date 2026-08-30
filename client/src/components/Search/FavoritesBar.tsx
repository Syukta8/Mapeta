import { Home, Briefcase, Coffee, ShoppingBag, Star, Plus } from 'lucide-react';
import type { FavoritePlace } from '../../models/FavoriteModel';

interface FavoritesBarProps {
  favorites: FavoritePlace[];
  onSelectFavorite: (fav: FavoritePlace) => void;
  onAddNew: () => void;
}

export function FavoritesBar({ favorites, onSelectFavorite, onAddNew }: FavoritesBarProps) {
  const getIcon = (type: FavoritePlace['type']) => {
    switch (type) {
      case 'home':
        return <Home className="w-3.5 h-3.5 text-[#a8c7fa]" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-amber-300" />;
      case 'cafe':
        return <Coffee className="w-3.5 h-3.5 text-orange-300" />;
      case 'store':
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />;
      default:
        return <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />;
    }
  };

  const home = favorites.find((f) => f.type === 'home');
  const work = favorites.find((f) => f.type === 'work');
  const customList = favorites.filter((f) => f.type !== 'home' && f.type !== 'work');

  return (
    <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 animate-in fade-in duration-200">
      {/* Home Chip */}
      <button
        onClick={() => (home ? onSelectFavorite(home) : onAddNew())}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border active:scale-95 ${
          home
            ? 'bg-[#212226] text-white border-white/10 hover:border-[#a8c7fa]/50 shadow-md'
            : 'bg-[#212226]/50 text-slate-400 border-dashed border-white/15 hover:text-white'
        }`}
      >
        <Home className="w-3.5 h-3.5 text-[#a8c7fa]" />
        <span>{home ? home.name : 'Set Home'}</span>
      </button>

      {/* Work Chip */}
      <button
        onClick={() => (work ? onSelectFavorite(work) : onAddNew())}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border active:scale-95 ${
          work
            ? 'bg-[#212226] text-white border-white/10 hover:border-amber-400/50 shadow-md'
            : 'bg-[#212226]/50 text-slate-400 border-dashed border-white/15 hover:text-white'
        }`}
      >
        <Briefcase className="w-3.5 h-3.5 text-amber-300" />
        <span>{work ? work.name : 'Set Work'}</span>
      </button>

      {/* Custom Favorite Places */}
      {customList.map((fav) => (
        <button
          key={fav.id}
          onClick={() => onSelectFavorite(fav)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#212226] text-white border border-white/10 hover:border-white/20 shadow-md shrink-0 transition-all active:scale-95"
        >
          {getIcon(fav.type)}
          <span className="truncate max-w-[100px]">{fav.name}</span>
        </button>
      ))}

      {/* Add New Favorite Button */}
      <button
        onClick={onAddNew}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-[#212226]/60 text-slate-400 hover:text-white border border-white/10 shrink-0 transition-all active:scale-95"
        title="Add Favorite Place"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
