import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TrafficService } from '../models/TrafficService.js';
import type { Incident } from '../types/navigation.js';
import type { RouteInfo } from '../types/navigation.js';

describe('TrafficService (Model Layer)', () => {
  test('generates empty traffic collection for null routes', () => {
    const res = TrafficService.generateRouteTrafficGeoJSON(null, []);
    assert.strictEqual(res.type, 'FeatureCollection');
    assert.strictEqual(res.features.length, 0);
  });

  test('maps traffic slowdowns along route coordinates near active incidents', () => {
    const mockRoute: RouteInfo = {
      id: 'route-test',
      distance: 5000,
      rawDuration: 300,
      trafficDelaySec: 0,
      duration: 300,
      geometry: {
        type: 'LineString',
        coordinates: [
          [101.6869, 3.1390],
          [101.6900, 3.1410],
          [101.6950, 3.1450],
        ],
      },
      steps: [],
      summary: 'Test Expressway',
      profile: 'driving',
      hasTolls: false,
      tollFareEstimate: 'Free',
      tollTotal: 0,
      tollBreakdown: [],
      label: 'Expressway',
      trafficStatus: 'smooth',
      incidentCount: 0,
    };

    const mockIncidents: Incident[] = [
      {
        id: 'inc-1',
        type: 'jam',
        subtype: 'Heavy Traffic',
        lat: 3.1410,
        lng: 101.6900,
        title: 'Heavy traffic jam',
        description: 'Congestion reported',
        reportedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        upvotes: 2,
        downvotes: 0,
        active: 1,
      },
    ];

    const trafficGeoJSON = TrafficService.generateRouteTrafficGeoJSON(mockRoute, mockIncidents);
    assert.strictEqual(trafficGeoJSON.type, 'FeatureCollection');
    assert.ok(trafficGeoJSON.features.length > 0);
  });
});
