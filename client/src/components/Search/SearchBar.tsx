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
      <div className="glass-genshin flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 shadow-2xl border border-[#d3bc8e]/40 focus-within:border-[#d3bc8e] transition-colors">
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-[#d3bc8e] animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-[#d3bc8e] shrink-0" />
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where shall we venture today?"
          className="w-full bg-transparent text-xs text-[#f7f4ee] placeholder-[#ede8db]/40 focus:outline-none"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="p-1 text-[#d3bc8e]/70 hover:text-[#f7f4ee]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-genshin rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col divide-y divide-[#d3bc8e]/15 max-h-64 overflow-y-auto border border-[#d3bc8e]/40">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 p-3 text-left hover:bg-[#d3bc8e]/10 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-[#d3bc8e]/20 border border-[#d3bc8e]/40 flex items-center justify-center shrink-0 text-[#d3bc8e]">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#f7f4ee] truncate">
                  {item.name || item.display_name?.split(',')[0]}
                </span>
                <span className="text-[10px] text-[#ede8db]/60 truncate">
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
