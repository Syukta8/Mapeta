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
}
