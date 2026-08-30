export interface SearchResult {
  id?: string;
  name?: string;
  display_name?: string;
  lat: string | number;
  lng?: string | number;
  lon?: string | number;
  category?: string;
}

export class GeocodeService {
  public static async search(query: string, limit: number = 6): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (err) {
      console.error('[GeocodeService] Search error:', err);
      return [];
    }
  }

  public static async reverseGeocode(lat: number, lng: number): Promise<{ name: string; display_name: string }> {
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          name: json.data.name || 'Selected Location',
          display_name: json.data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        };
      }
    } catch (e) {
      console.error('[GeocodeService] Reverse geocode error:', e);
    }
    return {
      name: 'Selected Location',
      display_name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
  }
}
