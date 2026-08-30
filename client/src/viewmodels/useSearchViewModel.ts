import { useState, useEffect, useRef, useCallback } from 'react';
import { GeocodeService, type SearchResult } from '../models/GeocodeService';

export function useSearchViewModel(onSelectCoordinates: (coords: [number, number]) => void) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const data = await GeocodeService.search(trimmed, 6);
      setResults(data);
      setIsLoading(false);
      setIsOpen(data.length > 0);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectResult = useCallback((result: SearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lng || result.lon || 0);

    setIsOpen(false);
    setQuery(result.name || result.display_name?.split(',')[0] || '');
    onSelectCoordinates([lng, lat]);
  }, [onSelectCoordinates]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openDropdown = useCallback(() => {
    if (results.length > 0) setIsOpen(true);
  }, [results.length]);

  return {
    state: {
      query,
      results,
      isLoading,
      isOpen,
    },
    actions: {
      setQuery,
      selectResult,
      clearSearch,
      closeDropdown,
      openDropdown,
    },
  };
}
