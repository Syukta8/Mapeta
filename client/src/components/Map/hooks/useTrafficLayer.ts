import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import type { Incident, RouteInfo } from '../../../types/navigation';
import { TrafficService } from '../../../models/TrafficService';

export function useTrafficLayer(
  map: maplibregl.Map | null,
  activeRoute: RouteInfo | null,
  incidents: Incident[],
  showTrafficLayer: boolean = true
) {
  useEffect(() => {
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
        map.addSource(sourceId, { type: 'geojson', data: trafficGeoJSON });

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
  }, [map, activeRoute, incidents, showTrafficLayer]);
}
