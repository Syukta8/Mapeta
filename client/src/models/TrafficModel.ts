export type TrafficCongestionStatus = 'smooth' | 'moderate' | 'heavy' | 'standstill';

export interface TrafficSegment {
  id: string;
  name: string;
  ref?: string;
  status: TrafficCongestionStatus;
  speedKmh: number;
  coordinates: [number, number][];
}

export interface TrafficGeoJSON {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    properties: {
      id: string;
      name: string;
      ref?: string;
      status: TrafficCongestionStatus;
      speedKmh: number;
    };
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
  }[];
}
