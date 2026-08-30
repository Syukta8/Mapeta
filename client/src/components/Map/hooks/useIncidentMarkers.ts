import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Incident } from '../../../types/navigation';

const ICON_CONFIG: Record<string, { bg: string; text: string; emoji: string }> = {
  police: { bg: 'bg-[#0b57d0]', text: 'text-white', emoji: '👮' },
  hazard: { bg: 'bg-amber-500', text: 'text-white', emoji: '⚠️' },
  jam: { bg: 'bg-red-500', text: 'text-white', emoji: '🚗' },
  closure: { bg: 'bg-purple-600', text: 'text-white', emoji: '🚧' },
  accident: { bg: 'bg-orange-600', text: 'text-white', emoji: '💥' },
};

export function useIncidentMarkers(
  map: maplibregl.Map | null,
  incidents: Incident[] = [],
  onIncidentClick?: (incident: Incident) => void
) {
  const incidentMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    incidentMarkersRef.current.forEach((marker) => marker.remove());
    incidentMarkersRef.current.clear();

    incidents.forEach((inc) => {
      const config = ICON_CONFIG[inc.type] || ICON_CONFIG.hazard;
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full ${config.bg} ${config.text} border-2 border-white shadow-xl flex items-center justify-center text-sm font-bold transform transition-transform group-hover:scale-125">
          ${config.emoji}
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1b1c20] text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/10 mt-1 shadow-lg pointer-events-none whitespace-nowrap">
          ${inc.title}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onIncidentClick) onIncidentClick(inc);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inc.lng, inc.lat])
        .addTo(map);

      incidentMarkersRef.current.set(inc.id, marker);
    });

    return () => {
      incidentMarkersRef.current.forEach((marker) => marker.remove());
      incidentMarkersRef.current.clear();
    };
  }, [map, incidents, onIncidentClick]);
}
