import pathlib

geo_hook = """import { useState, useEffect, useRef } from 'react';

export interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null; // meters per second
  } | null;
  speedKmh: number;
  speedMph: number;
  isSimulated: boolean;
  error: string | null;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    speedKmh: 0,
    speedMph: 0,
    isSimulated: false,
    error: null,
  });

  const lastPos = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({
        ...s,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        let calculatedSpeedKmh = 0;
        let calculatedHeading = pos.coords.heading;

        // If hardware speed is available (in m/s), convert to km/h
        if (pos.coords.speed !== null && pos.coords.speed > 0) {
          calculatedSpeedKmh = Math.round(pos.coords.speed * 3.6);
        } else if (lastPos.current) {
          // Calculate speed based on delta distance and delta time
          const dt = (pos.timestamp - lastPos.current.time) / 1000;
          if (dt > 1) {
            const dist = calculateDistance(
              lastPos.current.lat,
              lastPos.current.lng,
              pos.coords.latitude,
              pos.coords.longitude
            );
            const speedMs = dist / dt;
            calculatedSpeedKmh = Math.round(speedMs * 3.6);
            if (!calculatedHeading) {
              calculatedHeading = calculateBearing(
                lastPos.current.lat,
                lastPos.current.lng,
                pos.coords.latitude,
                pos.coords.longitude
              );
            }
          }
        }

        lastPos.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: pos.timestamp,
        };

        setState({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: calculatedHeading,
            speed: pos.coords.speed,
          },
          speedKmh: calculatedSpeedKmh,
          speedMph: Math.round(calculatedSpeedKmh * 0.621371),
          isSimulated: false,
          error: null,
        });
      },
      (err) => {
        console.warn('[Geolocation] Real GPS unavailable or denied:', err.message);
        // Fallback default coordinates (e.g. vibrant metropolis / Kuala Lumpur / Singapore / NY center)
        setState({
          coords: {
            latitude: 3.140853,
            longitude: 101.693207,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: 45,
            speed: 0,
          },
          speedKmh: 0,
          speedMph: 0,
          isSimulated: true,
          error: err.message,
        });
      },
      {
        enableHighAccuracy,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableHighAccuracy]);

  return state;
}

/**
 * Calculates haversine distance between two coordinates in meters.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) * Math.sin(dphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) * Math.sin(dlambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates initial bearing between two points in degrees (0-360).
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}
"""

orientation_hook = """import { useState, useEffect } from 'react';

export function useOrientation() {
  const [compassHeading, setCompassHeading] = useState<number | null>(null);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS / WebKit compass heading
      if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
        setCompassHeading((event as any).webkitCompassHeading);
      } else if (event.alpha !== null) {
        // Android standard device alpha
        setCompassHeading(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  return compassHeading;
}
"""

map_view = """import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { MAP_STYLES } from '../../styles/mapStyles';
import type { Incident, RouteInfo } from '../../types/navigation';

interface MapViewProps {
  theme: 'day' | 'night';
  userCoords: { latitude: number; longitude: number; heading: number | null } | null;
  activeRoute: RouteInfo | null;
  alternativeRoutes?: RouteInfo[];
  incidents: Incident[];
  isNavigating: boolean;
  followUser: boolean;
  onMapClick?: (coords: [number, number]) => void;
  onIncidentClick?: (incident: Incident) => void;
  onSelectAlternative?: (index: number) => void;
}

export function MapView({
  theme,
  userCoords,
  activeRoute,
  alternativeRoutes = [],
  incidents,
  isNavigating,
  followUser,
  onMapClick,
  onIncidentClick,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const incidentMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // 1. Initialize MapLibre instance
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
      attributionControl: false,
    });

    // Add scale bar
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    map.on('load', () => {
      // Add 3D Building Layer
      const layers = map.getStyle().layers;
      let labelLayerId: string | undefined;
      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && (layers[i] as any).layout?.['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }
      }

      if (!map.getSource('openmaptiles')) {
        // Fallback styling if 3D source is available
      }
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
      // Create glowing Waze-style navigation cursor
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center w-12 h-12';
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

    // Rotate cursor arrow
    const arrow = userMarkerRef.current.getElement().querySelector('#marker-arrow') as HTMLElement | null;
    if (arrow && heading !== null) {
      arrow.style.transform = `rotate(${heading}deg)`;
    }

    // Follow camera if active
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

  // 4. Render Route Polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderRoutes = () => {
      // Remove existing route layers/sources
      ['route-casing', 'route-line', 'alt-route-1', 'alt-route-2'].forEach((layerId) => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      ['route-source', 'alt-source-1', 'alt-source-2'].forEach((sourceId) => {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });

      // Render alternative routes first
      alternativeRoutes.forEach((alt, idx) => {
        const sourceId = `alt-source-${idx + 1}`;
        const layerId = `alt-route-${idx + 1}`;
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: alt.geometry,
          },
        });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#64748b',
            'line-width': 5,
            'line-opacity': 0.6,
          },
        });
      });

      // Render primary active route
      if (activeRoute) {
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: activeRoute.geometry,
          },
        });

        // Dark outline casing
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0284c7',
            'line-width': 9,
          },
        });

        // Glowing vibrant route line
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#38bdf8',
            'line-width': 6,
          },
        });

        // Fit map bounds to show route overview if not actively in HUD drive mode
        if (!isNavigating) {
          const coords = activeRoute.geometry.coordinates;
          const bounds = coords.reduce(
            (b, c) => b.extend(c as [number, number]),
            new maplibregl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, { padding: { top: 100, bottom: 180, left: 40, right: 40 } });
        }
      }
    };

    if (map.isStyleLoaded()) {
      renderRoutes();
    } else {
      map.once('styledata', renderRoutes);
    }
  }, [activeRoute, alternativeRoutes, isNavigating]);

  // 5. Render Incident Badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    incidentMarkersRef.current.forEach((marker) => marker.remove());
    incidentMarkersRef.current.clear();

    // Icon SVGs per category
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

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
"""

pathlib.Path('client/src/hooks/useGeolocation.ts').write_text(geo_hook, encoding='utf-8')
pathlib.Path('client/src/hooks/useOrientation.ts').write_text(orientation_hook, encoding='utf-8')
pathlib.Path('client/src/components/Map').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/components/Map/MapView.tsx').write_text(map_view, encoding='utf-8')
print('Stage 2 components generated successfully!')