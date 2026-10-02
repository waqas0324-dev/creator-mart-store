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
    // Label must be followed by whitespace (space, tab, etc.) — longest match wins.
    const m = lower.match(new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+'));
    if (m) {
      const key = line.slice(0, label.length).trim();
      const value = line.slice(m[0].length).trim();
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

// Removes the "Technical Specifications"/"Specifications" section (heading +
// following label-value spec lines, including TAB-separated ones) from the
// description HTML, so spec content doesn't render twice when the spec table
// is shown. Key Features and all other content are left intact.
// String-based (no DOMParser) so it also works outside the browser.
export function removeSpecSection(html: string): string {
  if (!html) return html;

  const textOf = (raw: string) => raw.replace(/<[^>]*>/g, '').replace(/\u00a0/g, ' ').trim();
  const isSpecHeadingText = (t: string) =>
    /^(specifications?|technical specifications?|product specifications?)$/i.test(t);
  const isSpecLineText = (t: string) => {
    if (!t) return true; // blank spacer lines inside the spec section
    if (/^([^:]{2,80}):\s*(.{2,300})$/.test(t)) return true;
    if (/^specifications?\s+details?$/i.test(t)) return true; // "Specification Detail" header row
    return matchKnownSpecLabel(t) !== null;
  };
  const BLOCK_TAG = /^(p|div|h1|h2|h3|h4|h5|h6|ul|ol|li|table|tr|blockquote)$/i;

  // Find a block element whose only text is a spec heading (no nested blocks).
  // Matches e.g. <div><b>Technical Specifications</b></div>.
  const findHeading = (src: string): { index: number; length: number } | null => {
    const re = /<(p|div|h1|h2|h3|h4|h5|h6)\b[^>]*>(?:\s*<[a-z][^>]*>\s*)*(specifications?|technical specifications?|product specifications?)(?:\s*<\/[a-z][^>]*>\s*)*<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      // Reject if the "inline" wrappers actually contain block-level tags.
      const inner = m[0].slice(m[0].indexOf('>') + 1, m[0].lastIndexOf('<'));
      const tagRe = /<\/?([a-z][a-z0-9]*)\b/gi;
      let tm: RegExpExecArray | null;
      let nested = false;
      while ((tm = tagRe.exec(inner)) !== null) {
        if (BLOCK_TAG.test(tm[1])) { nested = true; break; }
      }
      if (nested) continue;
      if (isSpecHeadingText(textOf(inner))) return { index: m.index, length: m[0].length };
      if (m[0].length === 0) break;
    }
    return null;
  };

  let out = html;
  // Loop in case of multiple spec sections.
  for (let guard = 0; guard < 5; guard++) {
    const found = findHeading(out);
    if (!found) break;
    let pos = found.index + found.length;
    const lineRe = /^\s*(<(p|div|li|tr)\b[^>]*>[\s\S]*?<\/\2>|<br\s*\/?>)/i;
    for (let g2 = 0; g2 < 200; g2++) {
      const lm = out.slice(pos).match(lineRe);
      if (!lm) break;
      if (!isSpecLineText(textOf(lm[1] || lm[0]))) break;
      pos += lm[0].length;
      if (lm[0].length === 0) break;
    }
    out = out.slice(0, found.index) + out.slice(pos);
  }
  return out;
}
