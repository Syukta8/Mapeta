import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { RouteInfo } from '../../../types/navigation';

export function useRoutePolyline(
  map: maplibregl.Map | null,
  allRoutes: RouteInfo[] = [],
  selectedRouteIndex: number = 0,
  activeRoute: RouteInfo | null = null,
  isNavigating: boolean = false,
  onSelectAlternative?: (index: number) => void
) {
  const lastFitBoundsKeyRef = useRef<string>('');

  useEffect(() => {
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
        map.addSource(sourceId, { type: 'geojson', data: geojsonData });

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
            if (!isNaN(idx)) onSelectAlternative(idx);
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
  }, [map, allRoutes, selectedRouteIndex, activeRoute, isNavigating, onSelectAlternative]);
}
