
// --- CITY NORMALIZATION ---
// Write-time only. Never compute at query time — kills index performance.
const CITY_ALIASES: Record<string, string> = {
  maputo: 'maputo',
  'cidade de maputo': 'maputo',
  matola: 'matola',
  beira: 'beira',
  sofala: 'beira',
  nampula: 'nampula',
  pemba: 'pemba',
  'porto amelia': 'pemba',
  zambezia:'quelimane',
  "maxixe": 'inhambane',
  manica: 'chimoio',
  tete: 'tete',
  'cidade de tete': 'tete',
  niassa: 'lichinga',
  'cidade de lichinga': 'lichinga',
  gaza: 'xai-xai',

};

export function normalizeCity(address: string): string {
  if (!address) return 'maputo';
  const clean = address
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  for (const [alias, slug] of Object.entries(CITY_ALIASES)) {
    if (clean.includes(alias)) return slug;
  }
  return 'maputo';
}
