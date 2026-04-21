/**
 * $lib/utils/location.ts
 *
 * City normalization — must run at WRITE TIME (form submit / server action).
 * Never compute city at query time — that kills index performance.
 *
 * Rules:
 *   - lowercase
 *   - strip accents
 *   - trim whitespace
 *   - map known aliases to canonical slug
 */

export const CITIES = [
  { slug: 'maputo', label: 'Maputo' },
  { slug: 'matola', label: 'Matola' },
  { slug: 'beira', label: 'Beira' },
  { slug: 'nampula', label: 'Nampula' },
  { slug: 'pemba', label: 'Pemba' }
] as const;

export type CitySlug = (typeof CITIES)[number]['slug'];

export const DEFAULT_CITY: CitySlug = 'maputo';

// Aliases map: any variant a merchant might type → canonical slug
const ALIASES: Record<string, CitySlug> = {
  maputo: 'maputo',
  'cidade de maputo': 'maputo',
  matola: 'matola',
  beira: 'beira',
  sofala: 'beira',
  nampula: 'nampula',
  pemba: 'pemba',
  'porto amelia': 'pemba'
};

/**
 * Normalize an address string to a city slug at write time.
 * Falls back to DEFAULT_CITY if no known city is found in the address.
 *
 * Usage: in the server action, before inserting/updating a promotion.
 *   const city = normalizeCity(data.locationAddress);
 */
export function normalizeCity(address: string): CitySlug {
  if (!address) return DEFAULT_CITY;

  // Remove accents, lowercase
  const clean = address
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Check alias map first (exact match on cleaned string)
  if (ALIASES[clean]) return ALIASES[clean];

  // Substring match — check if any alias appears anywhere in the address
  for (const [alias, slug] of Object.entries(ALIASES)) {
    if (clean.includes(alias)) return slug;
  }

  return DEFAULT_CITY;
}

/**
 * Get display label for a city slug.
 */
export function cityLabel(slug: string): string {
  return CITIES.find((c) => c.slug === slug)?.label ?? slug;
}
