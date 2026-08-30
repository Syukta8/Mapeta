import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../styles/mapStyles';
import type { Incident, RouteInfo } from '../../types/navigation';
import type { MapViewMode } from '../../viewmodels/useMapViewModel';
import { TrafficService } from '../../models/TrafficService';

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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const droppedPinMarkerRef = useRef<maplibregl.Marker | null>(null);
  const incidentMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const lastFitBoundsKeyRef = useRef<string>('');

  // 3-Second Long Press Tracking
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number; lngLat: maplibregl.LngLat } | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = userCoords ? userCoords.longitude : 101.6932;
    const initialLat = userCoords ? userCoords.latitude : 3.1408;

    const map = new maplibregl.Map({
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

    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    const clearLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartPosRef.current = null;
    };

    map.on('mousedown', (e) => {
      clearLongPress();
      touchStartPosRef.current = { x: e.point.x, y: e.point.y, lngLat: e.lngLat };
      longPressTimerRef.current = window.setTimeout(() => {
        if (onLongPressMap && touchStartPosRef.current) {
          onLongPressMap([touchStartPosRef.current.lngLat.lng, touchStartPosRef.current.lngLat.lat]);
        }
        clearLongPress();
      }, 3000);
    });

    map.on('touchstart', (e) => {
      clearLongPress();
      if (e.points && e.points[0]) {
        touchStartPosRef.current = { x: e.points[0].x, y: e.points[0].y, lngLat: e.lngLat };
        longPressTimerRef.current = window.setTimeout(() => {
          if (onLongPressMap && touchStartPosRef.current) {
            onLongPressMap([touchStartPosRef.current.lngLat.lng, touchStartPosRef.current.lngLat.lat]);
          }
          clearLongPress();
        }, 3000);
      }
    });

    map.on('mousemove', (e) => {
      if (touchStartPosRef.current) {
        const dx = Math.abs(e.point.x - touchStartPosRef.current.x);
        const dy = Math.abs(e.point.y - touchStartPosRef.current.y);
        if (dx > 8 || dy > 8) clearLongPress();
      }
    });

    map.on('touchmove', (e) => {
      if (touchStartPosRef.current && e.points && e.points[0]) {
        const dx = Math.abs(e.points[0].x - touchStartPosRef.current.x);
        const dy = Math.abs(e.points[0].y - touchStartPosRef.current.y);
        if (dx > 8 || dy > 8) clearLongPress();
      }
    });

    map.on('mouseup', clearLongPress);
    map.on('touchend', clearLongPress);
    map.on('dragstart', () => {
      clearLongPress();
      if (onUserPan) onUserPan();
    });

    mapRef.current = map;

    return () => {
      clearLongPress();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle = theme === 'night' ? MAP_STYLES.night : MAP_STYLES.day;
    mapRef.current.setStyle(targetStyle);
  }, [theme]);

  // Update user position marker and camera follow with 3-Way Perspective
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

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
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }

    const arrow = userMarkerRef.current.getElement().querySelector('#marker-arrow') as HTMLElement | null;
    if (arrow && heading !== null) {
      arrow.style.transform = `rotate(${heading}deg)`;
    }

    if (followUser && mapRef.current) {
      let targetPitch = 0;
      let targetBearing = 0;

      if (viewMode === '3d-heading') {
        targetPitch = isNavigating ? 55 : 45;
        targetBearing = heading !== null ? heading : mapRef.current.getBearing();
      } else if (viewMode === '2d-north') {
        targetPitch = 0;
        targetBearing = 0; // Always North up
      } else if (viewMode === '2d-heading') {
        targetPitch = 0;
        targetBearing = heading !== null ? heading : mapRef.current.getBearing();
      }

      mapRef.current.easeTo({
        center: [longitude, latitude],
        zoom: isNavigating ? 17 : 15,
        pitch: targetPitch,
        bearing: targetBearing,
        duration: 700,
      });
    }
  }, [userCoords, followUser, isNavigating, viewMode]);

  // 📍 Google Maps Dropped Pin Marker
  useEffect(() => {
    const map = mapRef.current;
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
  }, [selectedPoint]);

  // 🚦 Smooth Route-Aligned & Regional Live Traffic Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateTraffic = () => {
      const trafficGeoJSON = activeRoute
        ? TrafficService.generateRouteTrafficGeoJSON(activeRoute, incidents)
        : TrafficService.generateLiveTrafficGeoJSON(incidents);

      const sourceId = 'mapeta-traffic-source';
      const casingLayerId = 'mapeta-traffic-casing';
      const flowLayerId = 'mapeta-traffic-flow';

      const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

      if (existingSource) {
        existingSource.setData(trafficGeoJSON);
        if (map.getLayer(flowLayerId)) {
          map.setLayoutProperty(flowLayerId, 'visibility', showTrafficLayer ? 'visible' : 'none');
          map.setLayoutProperty(casingLayerId, 'visibility', showTrafficLayer ? 'visible' : 'none');
        }
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: trafficGeoJSON,
        });

        map.addLayer({
          id: casingLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: showTrafficLayer ? 'visible' : 'none',
          },
          paint: {
            'line-color': '#0d0e11',
            'line-width': 7,
            'line-opacity': 0.8,
          },
        });

        map.addLayer({
          id: flowLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            visibility: showTrafficLayer ? 'visible' : 'none',
          },
          paint: {
            'line-color': [
              'match',
              ['get', 'status'],
              'standstill',
              '#991b1b',
              'heavy',
              '#ef4444',
              'moderate',
              '#eab308',
              '#22c55e',
            ],
            'line-width': 4.5,
            'line-opacity': 0.95,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateTraffic();
    } else {
      map.once('styledata', updateTraffic);
    }
  }, [activeRoute, incidents, showTrafficLayer]);

  // Persistent Navigation Route Rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRoutes = () => {
      const routesToRender = allRoutes.length > 0 ? allRoutes : activeRoute ? [activeRoute] : [];

      const geojsonData: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features: routesToRender.map((r, idx) => ({
          type: 'Feature',
          properties: {
            routeIndex: idx,
            isSelected: idx === selectedRouteIndex ? 1 : 0,
          },
          geometry: r.geometry,
        })),
      };

      const sourceId = 'mapeta-routes-source';
      const casingLayerId = 'mapeta-routes-casing';
      const lineLayerId = 'mapeta-routes-line';

      const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

      if (existingSource) {
        existingSource.setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData,
        });

        map.addLayer({
          id: casingLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'line-sort-key': ['get', 'isSelected'],
          },
          paint: {
            'line-color': ['case', ['==', ['get', 'isSelected'], 1], '#042f66', '#1b1c20'],
            'line-width': ['case', ['==', ['get', 'isSelected'], 1], 9, 5],
            'line-opacity': ['case', ['==', ['get', 'isSelected'], 1], 0.95, 0.55],
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'line-sort-key': ['get', 'isSelected'],
          },
          paint: {
            'line-color': ['case', ['==', ['get', 'isSelected'], 1], '#a8c7fa', '#64748b'],
            'line-width': ['case', ['==', ['get', 'isSelected'], 1], 6, 3.5],
            'line-opacity': ['case', ['==', ['get', 'isSelected'], 1], 1, 0.75],
          },
        });

        map.on('click', lineLayerId, (e) => {
          if (e.features && e.features[0] && onSelectAlternative) {
            const idx = Number(e.features[0].properties?.routeIndex);
            if (!isNaN(idx)) {
              onSelectAlternative(idx);
            }
          }
        });

        map.on('mouseenter', lineLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', lineLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      if (!isNavigating && routesToRender.length > 0) {
        const boundsKey = `${routesToRender[0]?.distance}_${routesToRender.length}`;
        if (lastFitBoundsKeyRef.current !== boundsKey) {
          lastFitBoundsKeyRef.current = boundsKey;
          const allCoords = routesToRender.flatMap((r) => r.geometry.coordinates);
          if (allCoords.length > 0) {
            const bounds = allCoords.reduce(
              (b, c) => b.extend(c as [number, number]),
              new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
            );
            map.fitBounds(bounds, { padding: { top: 90, bottom: 220, left: 40, right: 40 } });
          }
        }
      } else if (routesToRender.length === 0) {
        lastFitBoundsKeyRef.current = '';
      }
    };

    if (map.isStyleLoaded()) {
      updateRoutes();
    } else {
      map.once('styledata', updateRoutes);
    }
  }, [allRoutes, selectedRouteIndex, activeRoute, isNavigating, onSelectAlternative]);

  // Incident Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    incidentMarkersRef.current.forEach((marker) => marker.remove());
    incidentMarkersRef.current.clear();

    const iconColors: Record<string, { bg: string; text: string; emoji: string }> = {
      police: { bg: 'bg-[#0b57d0]', text: 'text-white', emoji: '👮' },
      hazard: { bg: 'bg-amber-500', text: 'text-white', emoji: '⚠️' },
      jam: { bg: 'bg-red-500', text: 'text-white', emoji: '🚗' },
      closure: { bg: 'bg-purple-600', text: 'text-white', emoji: '🚧' },
      accident: { bg: 'bg-orange-600', text: 'text-white', emoji: '💥' },
    };

    incidents.forEach((inc) => {
      const config = iconColors[inc.type] || iconColors.hazard;
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
