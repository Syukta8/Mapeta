export interface SearchResult {
  id?: string;
  name?: string;
  display_name?: string;
  lat: string | number;
  lng?: string | number;
  lon?: string | number;
  category?: string;
}

export type PlaceCategoryType = 'petrol' | 'mall' | 'hospital' | 'airport' | 'transit' | 'landmark' | 'general';

export const CATEGORY_PATTERNS: Array<{ pattern: RegExp; type: PlaceCategoryType; color: string }> = [
  { pattern: /petrol|shell|petronas|caltex|bhp/i, type: 'petrol', color: 'text-amber-400' },
  { pattern: /mall|shopping|pavilion|mid valley|suria|klcc/i, type: 'mall', color: 'text-pink-400' },
  { pattern: /hospital|klinik|medical|doctor/i, type: 'hospital', color: 'text-red-400' },
  { pattern: /airport|klia|subang/i, type: 'airport', color: 'text-sky-400' },
  { pattern: /lrt|mrt|station|ktm|transit/i, type: 'transit', color: 'text-emerald-400' },
  { pattern: /bank|menara|tower|plaza/i, type: 'landmark', color: 'text-indigo-400' },
];

export function detectPlaceCategory(category?: string, name?: string): { type: PlaceCategoryType; color: string } {
  const text = `${category || ''} ${name || ''}`;
  const match = CATEGORY_PATTERNS.find((item) => item.pattern.test(text));
  if (match) {
    return { type: match.type, color: match.color };
  }
  return { type: 'general', color: 'text-[#a8c7fa]' };
}
