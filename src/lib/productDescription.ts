// Product description is the single source of truth for specification rows.
// The same parser is used when saving a product and when rendering the storefront.

export type ProductSpecification = { key: string; value: string };

const BLOCK_ENDINGS = /<\/(?:p|li|h1|h2|h3|h4|h5|h6|div|blockquote|tr)>/gi;
const BREAKS = /<br\s*\/?>/gi;
const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?|key features?|features?|highlights?)$/i;

export function extractProductSpecifications(html: string): ProductSpecification[] {
  if (!html || typeof window === 'undefined') return [];

  const normalized = html
    .replace(BLOCK_ENDINGS, '\n')
    .replace(BREAKS, '\n');

  const doc = new DOMParser().parseFromString(normalized, 'text/html');
  const rawLines = (doc.body.textContent || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const specs: ProductSpecification[] = [];
  let featureMode = false;
  let featureIndex = 1;

  const addSpec = (key: string, value: string) => {
    key = key.trim().replace(/\s+/g, ' ');
    value = value.trim().replace(/\s+/g, ' ');
    if (!key || !value) return;

    const signature = key.toLowerCase() + '\0' + value.toLowerCase();
    if (seen.has(signature)) return;
    seen.add(signature);
    specs.push({ key, value });
  };

  for (const originalLine of rawLines) {
    const isBullet = /^[•●▪◦*-]\s*/.test(originalLine);
    const line = originalLine.replace(/^[•●▪◦*-]\s*/, '').trim();

    if (SPEC_HEADINGS.test(line)) {
      featureMode = /features?|highlights?/i.test(line);
      continue;
    }

    // Explicit Label: Value lines are always specifications.
    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) {
      addSpec(match[1], match[2]);
      continue;
    }

    // Bullet points under Key Features / Features are converted automatically.
    if (isBullet && featureMode && line.length >= 2) {
      addSpec(`Feature ${featureIndex++}`, line);
    }
  }

  return specs;
}
