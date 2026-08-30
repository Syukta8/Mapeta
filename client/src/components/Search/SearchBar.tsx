import { useRef, useEffect } from 'react';
import { Search, MapPin, X, Loader2, Star, Fuel, ShoppingBag, Hospital, Plane, Train, Landmark } from 'lucide-react';
import { useSearchViewModel } from '../../viewmodels/useSearchViewModel';
import { detectPlaceCategory, type PlaceCategoryType } from '../../models/SearchModel';

interface SearchBarProps {
  onSelectResult: (coords: [number, number]) => void;
  onBookmarkResult?: (lat: number, lng: number, name: string, address: string) => void;
}

function CategoryIcon({ category, name }: { category?: string; name?: string }) {
  const { type, color } = detectPlaceCategory(category, name);
  const iconMap: Record<PlaceCategoryType, typeof MapPin> = {
    petrol: Fuel,
    mall: ShoppingBag,
    hospital: Hospital,
    airport: Plane,
    transit: Train,
    landmark: Landmark,
    general: MapPin,
  };
  const IconComp = iconMap[type] || MapPin;
  return <IconComp className={`w-3.5 h-3.5 ${color}`} />;
}

export function SearchBar({ onSelectResult, onBookmarkResult }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useSearchViewModel(onSelectResult);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        actions.closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actions]);

  return (
    <div ref={containerRef} className="relative w-full pointer-events-auto">
      {/* Search Input Bar */}
      <div className="pixel-card rounded-full p-1.5 pl-4 pr-2 shadow-2xl flex items-center gap-2 border border-white/10 bg-[#1b1c20]/95 backdrop-blur-xl">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={state.query}
          onChange={(e) => actions.setQuery(e.target.value)}
          onFocus={actions.openDropdown}
          placeholder="Search places, addresses, expressways in Malaysia..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 flex-1 w-full font-medium"
        />

        {state.isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}

        {state.query && !state.isLoading && (
          <button
            onClick={actions.clearSearch}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {state.isOpen && state.results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 pixel-card rounded-2xl shadow-2xl border border-white/15 overflow-hidden z-50 divide-y divide-white/5 bg-[#1b1c20]/98 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {state.results.map((result, idx) => {
            const displayName = result.display_name || result.name || '';
            const title = result.name || displayName.split(',')[0];
            const address = displayName.replace(title, '').replace(/^,\s*/, '');
            const latNum = Number(result.lat);
            const lngNum = Number(result.lng || result.lon || 0);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer transition-colors group"
                onClick={() => actions.selectResult(result)}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5 group-hover:border-[#a8c7fa]/40 transition-colors">
                    <CategoryIcon category={result.category} name={title} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white leading-tight truncate group-hover:text-[#a8c7fa] transition-colors">
                      {title}
                    </span>
                    {address && (
                      <span className="text-[10px] text-slate-400 leading-snug truncate mt-0.5">
                        {address}
                      </span>
                    )}
                  </div>
                </div>

                {onBookmarkResult && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkResult(latNum, lngNum, title, displayName);
                    }}
                    className="p-2 rounded-full text-slate-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors shrink-0 ml-1.5"
                    title="Save to Favorite Places"
                  >
                    <Star className="w-4 h-4 hover:fill-yellow-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
