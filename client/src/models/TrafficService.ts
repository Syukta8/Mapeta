import type { Incident } from './IncidentModel';
import type { TrafficGeoJSON, TrafficCongestionStatus } from './TrafficModel';

// Baseline Arterial & Expressway Key Corridors (Klang Valley, PLUS, ELITE, MEX, LDP, Federal Highway, etc.)
const BASELINE_HIGHWAY_CORRIDORS: { id: string; name: string; ref: string; coords: [number, number][] }[] = [
  // PLUS Highway (North-South E1/E2)
  {
    id: 'plus-e2-central',
    name: 'Lebuhraya Utara-Selatan (PLUS E2)',
    ref: 'E2',
    coords: [
      [101.698, 3.033], [101.734, 2.942], [101.782, 2.825], [101.865, 2.715], [101.938, 2.685], [102.045, 2.520]
    ]
  },
  {
    id: 'plus-e1-north',
    name: 'Lebuhraya Utara-Selatan (PLUS E1)',
    ref: 'E1',
    coords: [
      [101.612, 3.165], [101.583, 3.235], [101.552, 3.325], [101.485, 3.520], [101.350, 3.780]
    ]
  },
  // ELITE Highway (E6)
  {
    id: 'elite-e6',
    name: 'Lebuhraya Hubungan Tengah (ELITE E6)',
    ref: 'E6',
    coords: [
      [101.555, 3.085], [101.572, 3.025], [101.585, 2.955], [101.645, 2.890], [101.745, 2.825], [101.782, 2.825]
    ]
  },
  // MEX Highway (E20)
  {
    id: 'mex-e20',
    name: 'Maju Expressway (MEX E20)',
    ref: 'E20',
    coords: [
      [101.705, 3.135], [101.698, 3.065], [101.678, 2.985], [101.675, 2.925]
    ]
  },
  // LDP Highway (E11)
  {
    id: 'ldp-e11',
    name: 'Lebuhraya Damansara-Puchong (LDP E11)',
    ref: 'E11',
    coords: [
      [101.625, 3.165], [101.615, 3.125], [101.605, 3.065], [101.618, 3.015], [101.665, 2.975]
    ]
  },
  // Federal Highway (FT2)
  {
    id: 'federal-ft2',
    name: 'Lebuhraya Persekutuan (Federal Route 2)',
    ref: 'FT2',
    coords: [
      [101.715, 3.125], [101.655, 3.115], [101.585, 3.085], [101.515, 3.065], [101.445, 3.045]
    ]
  },
  // KESAS Highway (E5)
  {
    id: 'kesas-e5',
    name: 'Lebuhraya Shah Alam (KESAS E5)',
    ref: 'E5',
    coords: [
      [101.715, 3.065], [101.665, 3.055], [101.585, 3.035], [101.515, 3.005], [101.445, 2.995]
    ]
  },
  // SKVE (E26)
  {
    id: 'skve-e26',
    name: 'South Klang Valley Expressway (SKVE E26)',
    ref: 'E26',
    coords: [
      [101.755, 2.975], [101.685, 2.965], [101.585, 2.945], [101.425, 2.925]
    ]
  },
  // Coastal Route (FT5)
  {
    id: 'coastal-ft5',
    name: 'Jalan Klang-Banting (Federal Route 5)',
    ref: 'FT5',
    coords: [
      [101.445, 3.015], [101.465, 2.915], [101.505, 2.815], [101.625, 2.685], [101.785, 2.545]
    ]
  },
  // DUKE Highway (E33)
  {
    id: 'duke-e33',
    name: 'Duta-Ulu Kelang Expressway (DUKE E33)',
    ref: 'E33',
    coords: [
      [101.655, 3.185], [101.705, 3.195], [101.745, 3.185], [101.765, 3.175]
    ]
  }
];

export class TrafficService {
  /**
   * Generates dynamic traffic flow GeoJSON by mapping live crowd-sourced incidents to highway segments
   */
  public static generateLiveTrafficGeoJSON(incidents: Incident[] = []): TrafficGeoJSON {
    const features: TrafficGeoJSON['features'] = BASELINE_HIGHWAY_CORRIDORS.map((corridor) => {
      let status: TrafficCongestionStatus = 'smooth';
      let speedKmh = 90;

      // Check proximity of any active crowd incidents (jam, accident, closure, hazard) to this corridor
      incidents.forEach((inc) => {
        const isNearCorridor = corridor.coords.some(([cLng, cLat]) => {
          const dLng = Math.abs(cLng - inc.lng);
          const dLat = Math.abs(cLat - inc.lat);
          return dLng < 0.035 && dLat < 0.035; // ~3.5km buffer
        });

        if (isNearCorridor) {
          if (inc.type === 'jam') {
            if (inc.subtype === 'Standstill' || inc.upvotes >= 3) {
              status = 'standstill';
              speedKmh = 8;
            } else if (inc.subtype === 'Heavy Traffic' || inc.upvotes >= 1) {
              status = 'heavy';
              speedKmh = 22;
            } else {
              status = 'moderate';
              speedKmh = 45;
            }
          } else if (inc.type === 'accident' || inc.type === 'closure') {
            status = 'heavy';
            speedKmh = 18;
          } else if (inc.type === 'hazard') {
            if (status === 'smooth') {
              status = 'moderate';
              speedKmh = 50;
            }
          }
        }
      });

      return {
        type: 'Feature' as const,
        properties: {
          id: corridor.id,
          name: corridor.name,
          ref: corridor.ref,
          status,
          speedKmh,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: corridor.coords,
        },
      };
    });

    // Also generate local dynamic traffic flow glow around individual user-reported traffic jams
    incidents
      .filter((inc) => inc.type === 'jam' || inc.type === 'accident' || inc.type === 'closure')
      .forEach((inc) => {
        const offset = 0.008; // ~900m local traffic jam streak
        const status: TrafficCongestionStatus =
          inc.subtype === 'Standstill' || inc.type === 'closure'
            ? 'standstill'
            : inc.subtype === 'Heavy Traffic' || inc.type === 'accident'
            ? 'heavy'
            : 'moderate';

        features.push({
          type: 'Feature' as const,
          properties: {
            id: `incident-traffic-${inc.id}`,
            name: inc.title,
            ref: 'JAM',
            status,
            speedKmh: status === 'standstill' ? 5 : status === 'heavy' ? 15 : 35,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [inc.lng - offset, inc.lat - offset * 0.5],
              [inc.lng, inc.lat],
              [inc.lng + offset, inc.lat + offset * 0.5],
            ],
          },
        });
      });

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
