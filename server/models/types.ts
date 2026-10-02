/**
 * Represents an incident reported by a user.
 */
export interface Incident {
  id: string;
  type: 'police' | 'hazard' | 'jam' | 'closure' | 'accident';
  subtype?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  title: string;
  description?: string;
  idempotency_key?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  status?: 'active' | 'resolved' | 'expired';
  active: number;
  reporter_id?: string | null;
}

/**
 * Represents a saved favorite location.
 */
export interface Favorite {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address: string;
  created_at: number;
}

/**
 * Represents a geocoding search result.
 */
export interface GeocodeResult {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  lon?: number;
  category: string;
}

/**
 * Represents a reverse geocoding result.
 */
export interface ReverseGeocodeResult {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
}
