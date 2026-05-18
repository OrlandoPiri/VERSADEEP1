// --- SLUG GENERATION ---
// Runs at write time. Generates a URL-safe slug from title + merchant name.
// The numeric id is appended to guarantee uniqueness without a retry loop.
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '') // strip special chars
    .trim()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-'); // collapse consecutive hyphens
}

export function generateSlug(
  title: string,
  merchantName: string,
  id: number
): string {
  const base = slugify(`${title} ${merchantName}`).slice(0, 70);
  return `${base}-${id}`;
}
