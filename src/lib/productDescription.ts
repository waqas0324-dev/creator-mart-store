// Product description is the single source of truth for specification rows. Live storefront rendering uses the same parser.
// Keep this parser shared between admin save and storefront display.
export type ProductSpecification = { key: string; value: string };

const BLOCK_ENDINGS = /<\/(?:p|li|h2|h3|h4|div|blockquote)>/gi;
const BREAKS = /<br\s*\/?>/gi;

export function extractProductSpecifications(html: string): ProductSpecification[] {
  if (!html || typeof window === 'undefined') return [];

  const normalized = html
    .replace(BLOCK_ENDINGS, '\n')
    .replace(BREAKS, '\n');

  const doc = new DOMParser().parseFromString(normalized, 'text/html');
  const lines = (doc.body.textContent || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\u00a0/g, ' ').replace(/^[•●▪◦*-]\s*/, '').trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const specs: ProductSpecification[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]{2,60}):\s*(.{2,250})$/);
    if (!match) continue;

    const key = match[1].trim().replace(/\s+/g, ' ');
    const value = match[2].trim().replace(/\s+/g, ' ');
    if (!key || !value) continue;

    const signature = key.toLowerCase() + '\0' + value.toLowerCase();
    if (seen.has(signature)) continue;
    seen.add(signature);
    specs.push({ key, value });
  }

  return specs;
}

// Automatic specification parser build fix.

// Keep production build trigger aligned with parser fix.
