import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../styles/mapStyles';
import type { Incident, RouteInfo } from '../../types/navigation';

interface MapViewProps {
  theme: 'day' | 'night';
  userCoords: { latitude: number; longitude: number; heading: number | null } | null;
  activeRoute: RouteInfo | null;
  allRoutes?: RouteInfo[];
  selectedRouteIndex?: number;
  incidents: Incident[];
  isNavigating: boolean;
  followUser: boolean;
  onMapClick?: (coords: [number, number]) => void;
  onUserPan?: () => void;
  onIncidentClick?: (incident: Incident) => void;
  onSelectAlternative?: (index: number) => void;
}

export function MapView({
  theme,
  userCoords,
  activeRoute,
  allRoutes = [],
  selectedRouteIndex = 0,
  incidents,
  isNavigating,
  followUser,
  onMapClick,
  onUserPan,
  onIncidentClick,
  onSelectAlternative,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const incidentMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // 1. Initialize MapLibre instance with explicit drag & touch gesture support
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = userCoords ? userCoords.longitude : 101.6932;
    const initialLat = userCoords ? userCoords.latitude : 3.1408;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day,
      center: [initialLng, initialLat],
      zoom: 15,
      pitch: isNavigating ? 55 : 0,
      bearing: userCoords?.heading || 0,
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      dragRotate: true,
      attributionControl: false,
    });

    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    // Click handler for picking destination
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    // Detect user dragging or touch panning to disable automatic recentering
    map.on('dragstart', () => {
      if (onUserPan) onUserPan();
    });

    map.on('touchstart', () => {
      if (onUserPan) onUserPan();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Handle theme style changes
  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle = theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day;
    mapRef.current.setStyle(targetStyle);
  }, [theme]);

  // 3. Update User Location Marker & Camera Tracking
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

    const { latitude, longitude, heading } = userCoords;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center w-12 h-12 pointer-events-none';
      el.innerHTML = `
        <div class="user-pos-pulse absolute w-12 h-12 rounded-full bg-sky-400/40"></div>
        <div class="w-8 h-8 rounded-full bg-sky-500 border-2 border-white shadow-2xl flex items-center justify-center z-10">
          <svg id="marker-arrow" class="w-5 h-5 text-white transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }

    const arrow = userMarkerRef.current.getElement().querySelector('#marker-arrow') as HTMLElement | null;
    if (arrow && heading !== null) {
      arrow.style.transform = `rotate(${heading}deg)`;
    }

    // Only auto-pan camera if followUser is explicitly true
    if (followUser && mapRef.current) {
      mapRef.current.easeTo({
        center: [longitude, latitude],
        zoom: isNavigating ? 17 : mapRef.current.getZoom(),
        pitch: isNavigating ? 55 : 0,
        bearing: isNavigating && heading !== null ? heading : mapRef.current.getBearing(),
        duration: 800,
      });
    }
  }, [userCoords, followUser, isNavigating]);

  // 4. Render Multiple Routes and Alternative Route Polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderRoutes = () => {
      // Clear existing layers & sources
      for (let i = 0; i < 5; i++) {
        if (map.getLayer(`route-casing-${i}`)) map.removeLayer(`route-casing-${i}`);
        if (map.getLayer(`route-line-${i}`)) map.removeLayer(`route-line-${i}`);
        if (map.getSource(`route-source-${i}`)) map.removeSource(`route-source-${i}`);
      }

      if (allRoutes.length === 0 && activeRoute) {
        allRoutes = [activeRoute];
      }

      // Render alternative routes first, selected route on top
      allRoutes.forEach((r, idx) => {
        const isSelected = idx === selectedRouteIndex;
        const sourceId = `route-source-${idx}`;
        const casingLayerId = `route-casing-${idx}`;
        const lineLayerId = `route-line-${idx}`;

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { routeIndex: idx },
            geometry: r.geometry,
          },
        });

        // Casing outline
        map.addLayer({
          id: casingLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': isSelected ? '#0284c7' : '#334155',
            'line-width': isSelected ? 9 : 6,
            'line-opacity': isSelected ? 1 : 0.7,
          },
        });

        // Inner line
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': isSelected ? (r.hasTolls ? '#38bdf8' : '#34d399') : '#64748b',
            'line-width': isSelected ? 6 : 4,
            'line-opacity': isSelected ? 1 : 0.8,
          },
        });

        // Click on alternative route polyline to switch to it
        map.on('click', lineLayerId, () => {
          if (onSelectAlternative) {
            onSelectAlternative(idx);
          }
        });
      });

      // Fit map bounds to show full route if not actively driving
      if (!isNavigating && allRoutes[selectedRouteIndex]) {
        const coords = allRoutes[selectedRouteIndex].geometry.coordinates;
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: { top: 100, bottom: 220, left: 40, right: 40 } });
      }
    };

    if (map.isStyleLoaded()) {
      renderRoutes();
    } else {
      map.once('styledata', renderRoutes);
    }
  }, [allRoutes, selectedRouteIndex, activeRoute, isNavigating, onSelectAlternative]);

  // 5. Render Incident Badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    incidentMarkersRef.current.forEach((marker) => marker.remove());
    incidentMarkersRef.current.clear();

    const iconColors: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
      police: { bg: 'bg-blue-600', text: 'text-white', label: 'Police', emoji: '👮' },
      hazard: { bg: 'bg-amber-500', text: 'text-slate-950', label: 'Hazard', emoji: '⚠️' },
      jam: { bg: 'bg-rose-600', text: 'text-white', label: 'Jam', emoji: '🚗' },
      closure: { bg: 'bg-purple-600', text: 'text-white', label: 'Closure', emoji: '🚧' },
      accident: { bg: 'bg-orange-600', text: 'text-white', label: 'Accident', emoji: '💥' },
    };

    incidents.forEach((inc) => {
      const config = iconColors[inc.type] || iconColors.hazard;
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center';
      el.innerHTML = `
        <div class="w-9 h-9 rounded-2xl ${config.bg} ${config.text} border-2 border-white shadow-2xl flex items-center justify-center text-sm font-bold transform transition-transform group-hover:scale-125">
          ${config.emoji}
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-slate-700 mt-1 shadow-lg pointer-events-none whitespace-nowrap">
          ${inc.title}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onIncidentClick) {
          onIncidentClick(inc);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inc.lng, inc.lat])
        .addTo(map);

      incidentMarkersRef.current.set(inc.id, marker);
    });
  }, [incidents, onIncidentClick]);

  return <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
