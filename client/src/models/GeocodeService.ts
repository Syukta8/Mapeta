import { API_BASE } from '../config';

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
  private static abortController: AbortController | null = null;

  public static async search(query: string, limit: number = 6): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const timeoutId = setTimeout(() => this.abortController?.abort(), 5000);
      const res = await fetch(`${API_BASE}/api/geocode/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`, {
        signal: this.abortController.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[GeocodeService] Search error:', err);
      }
      return [];
    }
  }

  public static async reverseGeocode(lat: number, lng: number): Promise<{ name: string; display_name: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE}/api/geocode/reverse?lat=${lat}&lng=${lng}`, { signal: controller.signal });
      clearTimeout(timeoutId);

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
