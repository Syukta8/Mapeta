import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import type { SearchResult } from '../../types/navigation';

interface SearchBarProps {
  onSelectResult: (coords: [number, number], name: string) => void;
}

export function SearchBar({ onSelectResult }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('[SearchBar] Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lng || item.lon);
    const name = item.name || item.display_name || 'Selected Location';
    onSelectResult([lng, lat], name);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-sm pointer-events-auto">
      <div className="pixel-card flex items-center gap-3 rounded-full px-4 py-2.5 shadow-2xl border border-white/10 focus-within:border-[#a8c7fa] transition-colors">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-[#a8c7fa] animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-[#a8c7fa] shrink-0" />
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destination..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 pixel-card rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col divide-y divide-white/5 max-h-64 overflow-y-auto border border-white/10">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 p-3.5 text-left hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#a8c7fa]/15 flex items-center justify-center shrink-0 text-[#a8c7fa]">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {item.name || item.display_name?.split(',')[0]}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {item.display_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
