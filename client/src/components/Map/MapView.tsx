import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../styles/mapStyles';
import type { Incident, RouteInfo } from '../../types/navigation';
import type { MapViewMode } from '../../viewmodels/useMapViewModel';
import { useTrafficLayer } from './hooks/useTrafficLayer';
import { useRoutePolyline } from './hooks/useRoutePolyline';
import { useIncidentMarkers } from './hooks/useIncidentMarkers';

interface MapViewProps {
  theme: 'day' | 'night';
  userCoords: { latitude: number; longitude: number; heading: number | null } | null;
  activeRoute: RouteInfo | null;
  allRoutes?: RouteInfo[];
  selectedRouteIndex?: number;
  incidents: Incident[];
  isNavigating: boolean;
  followUser: boolean;
  viewMode?: MapViewMode;
  showTrafficLayer?: boolean;
  selectedPoint?: { lat: number; lng: number } | null;
  onLongPressMap?: (coords: [number, number]) => void;
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
  viewMode = '3d-heading',
  showTrafficLayer = true,
  selectedPoint = null,
  onLongPressMap,
  onUserPan,
  onIncidentClick,
  onSelectAlternative,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const droppedPinMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = userCoords ? userCoords.longitude : 101.6932;
    const initialLat = userCoords ? userCoords.latitude : 3.1408;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day,
      center: [initialLng, initialLat],
      zoom: 14,
      pitch: isNavigating ? 55 : 0,
      bearing: userCoords?.heading || 0,
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      dragRotate: true,
      attributionControl: false,
    });

    mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    let longPressTimer: number | null = null;
    let startPoint: { x: number; y: number; lngLat: maplibregl.LngLat } | null = null;

    const clearPress = () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = null;
      startPoint = null;
    };

    mapInstance.on('mousedown', (e) => {
      clearPress();
      startPoint = { x: e.point.x, y: e.point.y, lngLat: e.lngLat };
      longPressTimer = window.setTimeout(() => {
        if (onLongPressMap && startPoint) {
          onLongPressMap([startPoint.lngLat.lng, startPoint.lngLat.lat]);
        }
        clearPress();
      }, 3000);
    });

    mapInstance.on('touchstart', (e) => {
      clearPress();
      if (e.points && e.points[0]) {
        startPoint = { x: e.points[0].x, y: e.points[0].y, lngLat: e.lngLat };
        longPressTimer = window.setTimeout(() => {
          if (onLongPressMap && startPoint) {
            onLongPressMap([startPoint.lngLat.lng, startPoint.lngLat.lat]);
          }
          clearPress();
        }, 3000);
      }
    });

    mapInstance.on('mousemove', (e) => {
      if (startPoint && (Math.abs(e.point.x - startPoint.x) > 8 || Math.abs(e.point.y - startPoint.y) > 8)) {
        clearPress();
      }
    });

    mapInstance.on('touchmove', (e) => {
      if (startPoint && e.points && e.points[0]) {
        if (Math.abs(e.points[0].x - startPoint.x) > 8 || Math.abs(e.points[0].y - startPoint.y) > 8) {
          clearPress();
        }
      }
    });

    mapInstance.on('mouseup', clearPress);
    mapInstance.on('touchend', clearPress);
    mapInstance.on('dragstart', () => {
      clearPress();
      if (onUserPan) onUserPan();
    });

    setMap(mapInstance);

    return () => {
      clearPress();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Theme update
  useEffect(() => {
    if (!map) return;
    map.setStyle(theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day);
  }, [map, theme]);

  // User Marker & Camera follow
  useEffect(() => {
    if (!map || !userCoords) return;
    const { latitude, longitude, heading } = userCoords;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center w-12 h-12 pointer-events-none';
      el.innerHTML = `
        <div class="pixel-pos-pulse absolute w-12 h-12 rounded-full bg-[#a8c7fa]/30"></div>
        <div class="w-8 h-8 rounded-full bg-[#0b57d0] border-2 border-white shadow-2xl flex items-center justify-center z-10">
          <svg id="marker-arrow" class="w-4 h-4 text-white transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat([longitude, latitude])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }

    const arrow = userMarkerRef.current.getElement().querySelector('#marker-arrow') as HTMLElement | null;
    if (arrow && heading !== null) {
      arrow.style.transform = `rotate(${heading}deg)`;
    }

    if (followUser) {
      const targetPitch = viewMode === '3d-heading' ? (isNavigating ? 55 : 45) : 0;
      const targetBearing = viewMode === '2d-north' ? 0 : heading !== null ? heading : map.getBearing();
      map.easeTo({
        center: [longitude, latitude],
        zoom: isNavigating ? 17 : 15,
        pitch: targetPitch,
        bearing: targetBearing,
        duration: 700,
      });
    }
  }, [map, userCoords, followUser, isNavigating, viewMode]);

  // Dropped Pin Marker
  useEffect(() => {
    if (!map) return;
    if (!selectedPoint) {
      if (droppedPinMarkerRef.current) {
        droppedPinMarkerRef.current.remove();
        droppedPinMarkerRef.current = null;
      }
      return;
    }

    if (!droppedPinMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex flex-col items-center pointer-events-none animate-bounce';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center text-white font-bold text-sm">
          📍
        </div>
        <div class="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
      `;
      droppedPinMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([selectedPoint.lng, selectedPoint.lat])
        .addTo(map);
    } else {
      droppedPinMarkerRef.current.setLngLat([selectedPoint.lng, selectedPoint.lat]);
    }
  }, [map, selectedPoint]);

  // Attach Custom Map Hooks
  useTrafficLayer(map, activeRoute, incidents, showTrafficLayer);
  useRoutePolyline(map, allRoutes, selectedRouteIndex, activeRoute, isNavigating, onSelectAlternative);
  useIncidentMarkers(map, incidents, onIncidentClick);

  return <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
