// Product description is the single source of truth for specification rows.
// The same parser is used when saving a product and when rendering the storefront.

export type ProductSpecification = { key: string; value: string };

const BLOCK_ENDINGS = /<\/(?:p|li|h1|h2|h3|h4|h5|h6|div|blockquote|tr)>/gi;
const BREAKS = /<br\s*\/?>/gi;
const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?|key features?|features?|highlights?)$/i;

// Known spec labels so lines WITHOUT a colon (e.g. "Brand Plokama") can still
// become table rows when they appear under a Specifications heading.
// Longest match wins ("output power" beats "power").
const KNOWN_SPEC_LABELS = [
  'output power', 'battery capacity', 'battery life', 'light modes', 'light type',
  'color temperature', 'colour temperature', 'rgb colors', 'in the box',
  "what's in the box", 'noise cancellation', 'driver size', 'play time',
  'standby time', 'water resistance', 'model number', 'brand', 'model', 'power',
  'wattage', 'battery', 'rgb', 'mount', 'charging', 'portability', 'weight',
  'dimensions', 'size', 'color', 'colour', 'material', 'warranty', 'connectivity',
  'compatibility', 'display', 'screen', 'processor', 'ram', 'storage', 'capacity',
  'bluetooth', 'wireless', 'cable', 'input', 'output', 'voltage', 'frequency',
  'waterproof',
];

function matchKnownSpecLabel(line: string): { key: string; value: string } | null {
  const lower = line.toLowerCase();
  for (const label of KNOWN_SPEC_LABELS) {
    if (lower === label) continue;
    if (lower.startsWith(label + ' ')) {
      const key = line.slice(0, label.length).trim();
      const value = line.slice(label.length).trim();
      if (key && value.length >= 2) return { key, value };
    }
  }
  return null;
}

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
  let specMode = false;
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
      const isFeature = /features?|highlights?/i.test(line);
      featureMode = isFeature;
      specMode = !isFeature;
      continue;
    }

    // Explicit Label: Value lines are always specifications.
    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) {
      addSpec(match[1], match[2]);
      continue;
    }

    // Forgiving mode: under a Specifications heading, lines like
    // "Brand Plokama" (no colon) split on a known label.
    if (specMode) {
      const known = matchKnownSpecLabel(line);
      if (known) {
        addSpec(known.key, known.value);
        continue;
      }
    }

    // Bullet points under Key Features / Features are converted automatically.
    if (isBullet && featureMode && line.length >= 2) {
      addSpec(`Feature ${featureIndex++}`, line);
    }
  }

  return specs;
}
