import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { MapViewMode } from '../../../viewmodels/useMapViewModel';

interface UserCoords {
  latitude: number;
  longitude: number;
  heading: number | null;
}

interface UseMapCameraProps {
  map: maplibregl.Map | null;
  userCoords: UserCoords | null;
  followUser: boolean;
  isNavigating: boolean;
  viewMode: MapViewMode;
}

/**
 * Manages user GPS vehicle marker and camera following behavior on the map.
 */
export function useMapCamera({
  map,
  userCoords,
  followUser,
  isNavigating,
  viewMode,
}: UseMapCameraProps): void {
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

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

  // Clean up marker when unmounting
  useEffect(() => {
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [map]);
}
