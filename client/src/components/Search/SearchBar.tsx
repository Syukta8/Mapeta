import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Star } from 'lucide-react';
import { GeocodeService, type SearchResult } from '../../models/GeocodeService';

interface SearchBarProps {
  onSelectResult: (coords: [number, number]) => void;
  onBookmarkResult?: (lat: number, lng: number, name: string, address: string) => void;
}

export function SearchBar({ onSelectResult, onBookmarkResult }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = window.setTimeout(async () => {
      const items = await GeocodeService.search(query, 6);
      setResults(items);
      setIsLoading(false);
      setIsOpen(items.length > 0);
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon || item.lng);
    onSelectResult([lng, lat]);
    setIsOpen(false);
    setQuery(item.name || item.display_name?.split(',')[0] || query);
  };

  return (
    <div ref={wrapperRef} className="relative w-full pointer-events-auto">
      {/* Pixel Search Input Pill */}
      <div className="pixel-card flex items-center px-3.5 py-2.5 rounded-full shadow-2xl border border-white/10 focus-within:border-[#a8c7fa]/60 focus-within:ring-2 focus-within:ring-[#a8c7fa]/20 transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Where to? Search destination..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#a8c7fa] animate-spin shrink-0 ml-1.5" />}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 pixel-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((item, idx) => {
            const title = item.name || item.display_name?.split(',')[0] || 'Unknown Place';
            const subtitle = item.display_name?.split(',').slice(1, 3).join(',') || '';
            const lat = Number(item.lat);
            const lng = Number(item.lon || item.lng);

            return (
              <div
                key={idx}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition-colors cursor-pointer group"
                onClick={() => handleSelect(item)}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-full bg-[#212226] border border-white/10 flex items-center justify-center shrink-0 text-slate-300 group-hover:text-[#a8c7fa]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-bold text-white truncate">{title}</span>
                    {subtitle && <span className="text-[10px] text-slate-400 truncate">{subtitle}</span>}
                  </div>
                </div>

                {onBookmarkResult && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookmarkResult(lat, lng, title, subtitle);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-yellow-300 hover:bg-white/10 transition-all shrink-0"
                    title="Save to Favorites"
                  >
                    <Star className="w-3.5 h-3.5" />
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
