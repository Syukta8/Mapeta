import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapInteractionsProps {
  map: maplibregl.Map | null;
  onLongPressMap?: (coords: [number, number]) => void;
  onUserPan?: () => void;
  selectedPoint?: { lat: number; lng: number } | null;
}

/**
 * Manages map gestures (long press for pin drop, user drag/pan tracking) and pin marker.
 */
export function useMapInteractions({
  map,
  onLongPressMap,
  onUserPan,
  selectedPoint,
}: UseMapInteractionsProps): void {
  const droppedPinMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onUserPanRef = useRef(onUserPan);
  onUserPanRef.current = onUserPan;

  const onLongPressMapRef = useRef(onLongPressMap);
  onLongPressMapRef.current = onLongPressMap;

  // Setup long press and pan gesture listeners
  useEffect(() => {
    if (!map) return;

    let longPressTimer: number | null = null;
    let startPoint: { x: number; y: number; lngLat: maplibregl.LngLat } | null = null;

    const clearPress = () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = null;
      startPoint = null;
    };

    const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
      clearPress();
      startPoint = { x: e.point.x, y: e.point.y, lngLat: e.lngLat };
      longPressTimer = window.setTimeout(() => {
        if (onLongPressMapRef.current && startPoint) {
          onLongPressMapRef.current([startPoint.lngLat.lng, startPoint.lngLat.lat]);
        }
        clearPress();
      }, 3000);
    };

    const handleTouchStart = (e: maplibregl.MapTouchEvent) => {
      clearPress();
      if (e.points && e.points[0]) {
        startPoint = { x: e.points[0].x, y: e.points[0].y, lngLat: e.lngLat };
        longPressTimer = window.setTimeout(() => {
          if (onLongPressMapRef.current && startPoint) {
            onLongPressMapRef.current([startPoint.lngLat.lng, startPoint.lngLat.lat]);
          }
          clearPress();
        }, 3000);
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (startPoint && (Math.abs(e.point.x - startPoint.x) > 8 || Math.abs(e.point.y - startPoint.y) > 8)) {
        clearPress();
      }
    };

    const handleTouchMove = (e: maplibregl.MapTouchEvent) => {
      if (startPoint && e.points && e.points[0]) {
        if (Math.abs(e.points[0].x - startPoint.x) > 8 || Math.abs(e.points[0].y - startPoint.y) > 8) {
          clearPress();
          if (onUserPanRef.current) onUserPanRef.current();
        }
      }
    };

    const handleDragStart = () => {
      clearPress();
      if (onUserPanRef.current) onUserPanRef.current();
    };

    const handleMoveStart = (e: maplibregl.MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined>) => {
      if (e.originalEvent) {
        clearPress();
        if (onUserPanRef.current) onUserPanRef.current();
      }
    };

    map.on('mousedown', handleMouseDown);
    map.on('touchstart', handleTouchStart);
    map.on('mousemove', handleMouseMove);
    map.on('touchmove', handleTouchMove);
    map.on('mouseup', clearPress);
    map.on('touchend', clearPress);
    map.on('dragstart', handleDragStart);
    map.on('movestart', handleMoveStart);

    return () => {
      clearPress();
      map.off('mousedown', handleMouseDown);
      map.off('touchstart', handleTouchStart);
      map.off('mousemove', handleMouseMove);
      map.off('touchmove', handleTouchMove);
      map.off('mouseup', clearPress);
      map.off('touchend', clearPress);
      map.off('dragstart', handleDragStart);
      map.off('movestart', handleMoveStart);
    };
  }, [map]);

  // Manage dropped pin marker
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

  // Cleanup dropped pin on unmount
  useEffect(() => {
    return () => {
      if (droppedPinMarkerRef.current) {
        droppedPinMarkerRef.current.remove();
        droppedPinMarkerRef.current = null;
      }
    };
  }, [map]);
}
