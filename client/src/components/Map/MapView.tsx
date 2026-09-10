import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../styles/mapStyles';
import type { Incident, RouteInfo } from '../../types/navigation';
import type { MapViewMode } from '../../viewmodels/useMapViewModel';
import { useTrafficLayer } from './hooks/useTrafficLayer';
import { useRoutePolyline } from './hooks/useRoutePolyline';
import { useIncidentMarkers } from './hooks/useIncidentMarkers';
import { useMapTheme } from './hooks/useMapTheme';
import { useMapCamera } from './hooks/useMapCamera';
import { useMapInteractions } from './hooks/useMapInteractions';

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
  viewMode = '2d-heading',
  showTrafficLayer = true,
  selectedPoint = null,
  onLongPressMap,
  onUserPan,
  onIncidentClick,
  onSelectAlternative,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = userCoords ? userCoords.longitude : 101.6932;
    const initialLat = userCoords ? userCoords.latitude : 3.1408;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day,
      center: [initialLng, initialLat],
      zoom: 14,
      pitch: 0,
      bearing: userCoords?.heading || 0,
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      dragRotate: true,
      attributionControl: false,
    });

    mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    setMap(mapInstance);

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Theme synchronization hook
  useMapTheme(map, theme);

  // Vehicle camera and GPS tracking hook
  useMapCamera({
    map,
    userCoords,
    followUser,
    isNavigating,
    viewMode,
  });

  // Map gestures (long press, pan detection) and dropped pin marker hook
  useMapInteractions({
    map,
    onLongPressMap,
    onUserPan,
    selectedPoint,
  });

  // Route, traffic, and incident layers
  useTrafficLayer(map, activeRoute, incidents, showTrafficLayer);
  useRoutePolyline(map, allRoutes, selectedRouteIndex, activeRoute, isNavigating, onSelectAlternative);
  useIncidentMarkers(map, incidents, onIncidentClick);

  return <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
