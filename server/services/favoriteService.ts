/**
 * Business logic for favorites.
 */
import * as favoriteModel from '../models/favoriteModel.js';
import type { Favorite } from '../models/types.js';
import { randomUUID } from 'crypto';

/**
 * Retrieves all saved favorites.
 * @returns {Favorite[]} List of favorites.
 */
export function listFavorites(): Favorite[] {
  return favoriteModel.findAll();
}

/**
 * Saves a new favorite, optionally replacing an existing one by type.
 * @param data - The favorite data to save.
 * @returns {Favorite} The saved favorite.
 */
export function saveFavorite(data: { name: string; type?: string; lat: number; lng: number; address?: string }): Favorite {
  if (data.type === 'home' || data.type === 'work') {
    favoriteModel.deleteByType(data.type);
  }

  const id = `fav-${randomUUID().slice(0, 8)}`;
  
  const favorite: Favorite = {
    id,
    name: data.name,
    type: data.type || 'custom',
    lat: data.lat,
    lng: data.lng,
    address: data.address || '',
    created_at: Date.now()
  };

  favoriteModel.create(favorite);
  
  const saved = favoriteModel.findById(id);
  if (!saved) {
    throw new Error('Failed to save favorite.');
  }

  return saved;
}

/**
 * Removes a favorite by ID.
 * @param id - The ID of the favorite to remove.
 * @returns Object containing the removed ID.
 */
export function removeFavorite(id: string): { id: string } {
  favoriteModel.deleteById(id);
  return { id };
}
