/**
 * Geocoding and search services.
 */
import * as favoriteModel from '../models/favoriteModel.js';
import type { GeocodeResult, ReverseGeocodeResult } from '../models/types.js';

const searchCache = new Map<string, { data: GeocodeResult[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Searches for places combining local favorites and external APIs.
 * @param query - The search query.
 * @param limit - Max number of results (default: 6).
 * @returns {Promise<GeocodeResult[]>} Array of geocode results.
 */
export async function searchPlaces(query: string, limit: number = 6): Promise<GeocodeResult[]> {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  const now = Date.now();
  const cacheKey = trimmed.toLowerCase();
  const cached = searchCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const localFavorites = favoriteModel.search(trimmed, 3);
  let externalResults: GeocodeResult[] = [];

  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=${limit}&lat=3.1390&lon=101.6869`;
    const response = await fetch(photonUrl, {
      headers: { 'User-Agent': 'Mapeta-GPS/1.0' }
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.features && Array.isArray(data.features)) {
        externalResults = data.features.map((f: any) => {
          const p = f.properties || {};
          const name = p.name || p.street || p.city || trimmed;
          const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
          return {
            id: `osm-${p.osm_id || Math.random()}`,
            name,
            display_name: parts.join(', ') || name,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            lon: f.geometry.coordinates[0],
            category: p.osm_value || 'place'
          };
        });
      }
    }
  } catch (err) {
    console.error('[GeocodeService] Photon error:', err);
  }

  if (externalResults.length === 0) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=${limit}&countrycodes=my,sg,id,th`;
      const nomResponse = await fetch(nomUrl, {
        headers: {
          'User-Agent': 'Mapeta-GPS-Local/1.0',
          'Accept-Language': 'en',
        }
      });

      if (nomResponse.ok) {
        const nomData = await nomResponse.json() as any[];
        externalResults = nomData.map((item: any) => ({
          id: `osm-${item.place_id || Math.random()}`,
          name: item.name || item.display_name?.split(',')[0] || trimmed,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          lon: parseFloat(item.lon),
          category: item.type || 'place'
        }));
      }
    } catch (err) {
      console.error('[GeocodeService] Nominatim fallback error:', err);
    }
  }

  const combined = [...localFavorites, ...externalResults].slice(0, limit);
  searchCache.set(cacheKey, { data: combined, timestamp: now });

  return combined;
}

/**
 * Reverse geocodes coordinates into a location name.
 * @param lat - Latitude.
 * @param lng - Longitude.
 * @returns {Promise<ReverseGeocodeResult>} Reverse geocode result.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const response = await fetch(photonUrl, {
      headers: { 'User-Agent': 'Mapeta-GPS/1.0' }
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties || {};
        const name = props.name || props.street || 'Selected Location';
        const parts = [props.name, props.street, props.district, props.city, props.state].filter(Boolean);
        return {
          name,
          display_name: parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          lat,
          lng
        };
      }
    }
  } catch (err) {
    console.error('[GeocodeService] Photon reverse geocode error:', err);
  }

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const nomResponse = await fetch(nomUrl, {
      headers: {
        'User-Agent': 'Mapeta-GPS-Local/1.0',
        'Accept-Language': 'en',
      }
    });

    if (nomResponse.ok) {
      const data = await nomResponse.json() as any;
      if (data && data.display_name) {
        return {
          name: data.name || data.display_name?.split(',')[0] || 'Selected Location',
          display_name: data.display_name || `${lat}, ${lng}`,
          lat,
          lng
        };
      }
    }
  } catch (err) {
    console.error('[GeocodeService] Nominatim reverse geocode error:', err);
  }

  return {
    name: 'Selected Location',
    display_name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng
  };
}
