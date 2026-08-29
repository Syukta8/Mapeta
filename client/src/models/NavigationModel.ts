export type ManeuverType = 
  | 'turn-left'
  | 'turn-right'
  | 'turn-slight-left'
  | 'turn-slight-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'straight'
  | 'roundabout'
  | 'merge'
  | 'on-ramp'
  | 'off-ramp'
  | 'fork'
  | 'u-turn'
  | 'arrive'
  | 'depart';

export interface RouteStep {
  distance: number;
  duration: number;
  name: string;
  ref?: string;
  instruction: string;
  maneuverType: ManeuverType;
  modifier?: string;
  location: [number, number];
}

export interface TollBreakdownItem {
  expressway: string;
  code: string;
  distanceKm: number;
  fare: number;
  type: 'open' | 'closed';
}

export interface RouteInfo {
  id: string;
  distance: number; // meters
  rawDuration: number; // base duration without traffic (seconds)
  trafficDelaySec: number; // simulated delay from traffic jams/hazards (seconds)
  duration: number; // total duration = rawDuration + trafficDelaySec (seconds)
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  steps: RouteStep[];
  summary: string;
  profile: 'driving' | 'bike' | 'foot';
  hasTolls: boolean;
  tollFareEstimate: string;
  tollTotal: number;
  tollBreakdown: TollBreakdownItem[];
  label: string;
  trafficStatus: 'smooth' | 'moderate' | 'heavy';
  incidentCount: number;
}

export type TravelProfile = 'driving' | 'bike' | 'foot';

export interface Coordinates {
  latitude: number;
  longitude: number;
  heading: number | null;
}
