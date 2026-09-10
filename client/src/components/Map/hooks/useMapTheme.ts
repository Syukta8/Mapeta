import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../../styles/mapStyles';

/**
 * Synchronizes the MapLibre map style when day/night theme changes.
 */
export function useMapTheme(map: maplibregl.Map | null, theme: 'day' | 'night'): void {
  useEffect(() => {
    if (!map) return;
    map.setStyle(theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day);
  }, [map, theme]);
}
