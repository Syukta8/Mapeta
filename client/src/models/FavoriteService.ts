import type { FavoritePlace, CreateFavoritePayload } from './FavoriteModel';
import { API_BASE } from '../config';

const LOCAL_STORAGE_KEY = 'mapeta_favorites_cache';

export class FavoriteService {
  public static async getFavorites(): Promise<FavoritePlace[]> {
    try {
      const res = await fetch(`${API_BASE}/api/favorites`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
        return json.data;
      }
    } catch (e) {
      console.warn('[FavoriteService] Falling back to localStorage cache:', e);
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  public static async saveFavorite(payload: CreateFavoritePayload): Promise<FavoritePlace | null> {
    try {
      const res = await fetch(`${API_BASE}/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (e) {
      console.error('[FavoriteService] Save error:', e);
    }
    return null;
  }

  public static async deleteFavorite(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/favorites/${id}`, { method: 'DELETE' });
      const json = await res.json();
      return json.success === true;
    } catch (e) {
      console.error('[FavoriteService] Delete error:', e);
      return false;
    }
  }
}
