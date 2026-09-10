import { getStatement } from '../db/database.js';
import { Favorite, GeocodeResult } from './types.js';

/**
 * Retrieves all favorite locations.
 * @returns Array of all favorites.
 */
export function findAll(): Favorite[] {
  const stmt = getStatement('SELECT * FROM favorites ORDER BY created_at DESC');
  return stmt.all() as Favorite[];
}

/**
 * Finds a favorite by its ID.
 * @param id The ID of the favorite.
 * @returns The favorite if found, otherwise undefined.
 */
export function findById(id: string): Favorite | undefined {
  const stmt = getStatement('SELECT * FROM favorites WHERE id = ?');
  return stmt.get(id) as Favorite | undefined;
}

/**
 * Searches favorites by name or address.
 * @param query The search query string.
 * @param limit The maximum number of results to return.
 * @returns Array of geocode results matching the query.
 */
export function search(query: string, limit: number): GeocodeResult[] {
  const stmt = getStatement(`
    SELECT id, name, type as category, lat, lng, address as display_name 
    FROM favorites 
    WHERE name LIKE ? OR address LIKE ? 
    LIMIT ?
  `);
  const searchTerm = `%${query}%`;
  return stmt.all(searchTerm, searchTerm, limit) as GeocodeResult[];
}

/**
 * Deletes favorites by their type.
 * @param type The type of favorites to delete.
 */
export function deleteByType(type: string): void {
  const stmt = getStatement('DELETE FROM favorites WHERE type = ?');
  stmt.run(type);
}

/**
 * Creates a new favorite location.
 * @param fav The favorite to create.
 */
export function create(fav: Favorite): void {
  const stmt = getStatement(`
    INSERT INTO favorites (id, name, type, lat, lng, address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    fav.id,
    fav.name,
    fav.type,
    fav.lat,
    fav.lng,
    fav.address,
    fav.created_at
  );
}

/**
 * Deletes a favorite by its ID.
 * @param id The ID of the favorite to delete.
 */
export function deleteById(id: string): void {
  const stmt = getStatement('DELETE FROM favorites WHERE id = ?');
  stmt.run(id);
}
