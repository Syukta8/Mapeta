export type FavoriteType = 'home' | 'work' | 'cafe' | 'store' | 'custom';

export interface FavoritePlace {
  id: string;
  name: string;
  type: FavoriteType;
  lat: number;
  lng: number;
  address?: string;
  created_at: number;
}

export interface CreateFavoritePayload {
  name: string;
  type: FavoriteType;
  lat: number;
  lng: number;
  address?: string;
}
