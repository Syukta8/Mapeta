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
  distance: number; // meters
  duration: number; // seconds
  name: string;
  instruction: string;
  maneuverType: ManeuverType;
  modifier?: string;
  location: [number, number]; // [lng, lat]
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  steps: RouteStep[];
  summary: string;
  profile: 'driving' | 'bike' | 'foot';
}

export interface Incident {
  id: string;
  type: 'police' | 'hazard' | 'jam' | 'closure' | 'accident';
  lat: number;
  lng: number;
  title: string;
  description?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  active: number;
}

export interface SearchResult {
  id?: string;
  name?: string;
  display_name?: string;
  lat: string | number;
  lng?: string | number;
  lon?: string | number;
  category?: string;
}
