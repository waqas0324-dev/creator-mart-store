// spec-extractor v3
// Product description is the single source of truth for specification rows.
// Only an explicit Specifications / Technical Specifications / Product Specifications
// section is eligible for automatic table extraction. Everything else stays normal
// description content.

export type ProductSpecification = { key: string; value: string };

const BLOCK_ENDINGS = /<\/(?:p|li|h1|h2|h3|h4|h5|h6|div|blockquote|tr)>/gi;
const BREAKS = /<br\s*\/?>/gi;
const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?)$/i;

const KNOWN_SPEC_LABELS = [
  'output power', 'battery capacity', 'battery life', 'light modes', 'light type',
  'color temperature', 'colour temperature', 'rgb colors', 'in the box',
  "what's in the box", 'noise cancellation', 'driver size', 'play time',
  'standby time', 'water resistance', 'model number', 'brand', 'model', 'power',
  'wattage', 'battery', 'rgb', 'mount', 'charging', 'portability', 'weight',
  'dimensions', 'size', 'color', 'colour', 'material', 'warranty', 'connectivity',
  'compatibility', 'display', 'screen', 'processor', 'ram', 'storage', 'capacity',
  'bluetooth', 'wireless', 'cable', 'input', 'output', 'voltage', 'frequency',
  'waterproof', 'product type', 'panel size', 'microphone configuration',
  'pickup pattern', 'operation', 'design', 'attachment', 'lighting modes',
  'brightness', 'mirror', 'rotation', 'charging port', 'battery backup',
  'extended length', 'folded length', 'phone holder', 'tilt adjustment',
  'remote control', 'lighting', 'design type', 'usage',
];

function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(value: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = value;
  return normalizeText(temp.textContent || '');
}

function matchKnownSpecLabel(line: string): { key: string; value: string } | null {
  const lower = line.toLowerCase();
  for (const label of KNOWN_SPEC_LABELS) {
    const escaped = label.replace(/[.*+?^()|[\]\\]/g, '\\$&');
    const m = lower.match(new RegExp('^' + escaped + '\\s+'));
    if (m) {
      const key = line.slice(0, label.length).trim();
      const value = line.slice(m[0].length).trim();
      if (key && value.length >= 2) return { key, value };
    }
  }
  return null;
}

function isSpecHeadingElement(el: Element): boolean {
  const text = normalizeText(el.textContent || '');
  return SPEC_HEADINGS.test(text);
}

function isHeadingElement(el: Element): boolean {
  return /^H[1-6]$/.test(el.tagName);
}

function findSpecificationHeadings(doc: Document): Element[] {
  return Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div'))
    .filter(isSpecHeadingElement);
}

function addUniqueSpec(
  specs: ProductSpecification[],
  seen: Set<string>,
  key: string,
  value: string,
) {
  key = normalizeText(key).replace(/:$/, '');
  value = normalizeText(value);
  if (!key || !value || value.length < 2) return;

  const signature = key.toLowerCase() + '\0' + value.toLowerCase();
  if (seen.has(signature)) return;
  seen.add(signature);
  specs.push({ key, value });
}

function parseSpecificationSection(
  heading: Element,
  specs: ProductSpecification[],
  seen: Set<string>,
) {
  const section = document.createElement('div');
  let node = heading.nextElementSibling;

  while (node) {
    if (isHeadingElement(node)) break;
    section.appendChild(node.cloneNode(true));
    node = node.nextElementSibling;
  }

  // 1) Real HTML tables.
  for (const row of Array.from(section.querySelectorAll('tr'))) {
    const cells = Array.from(row.querySelectorAll('th,td'))
      .map(cell => normalizeText(cell.textContent || ''))
      .filter(Boolean);
    if (cells.length >= 2) {
      addUniqueSpec(specs, seen, cells[0], cells.slice(1).join(' '));
    }
  }

  // 2) List / paragraph rows such as <strong>Brand:</strong> Plokama.
  for (const item of Array.from(section.querySelectorAll('li,p,div'))) {
    const text = normalizeText(item.textContent || '');
    const match = text.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) {
      addUniqueSpec(specs, seen, match[1], match[2]);
    }
  }

  // 3) Compact editor output used by older products:
  // <strong>Brand</strong>Plokama<strong>Model</strong>Live-K6...
  const html = section.innerHTML;
  const strongRe = /<(?:strong|b)\b[^>]*>[\s\S]*?<\/(?:strong|b)>/gi;
  const matches = Array.from(html.matchAll(strongRe));

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length
      ? (matches[i + 1].index ?? html.length)
      : html.length;
    const label = stripHtml(current[0]);
    const value = stripHtml(html.slice((current.index ?? 0) + current[0].length, nextIndex));

    if (/^(specification|specifications|details)$/i.test(label)) continue;
    if (value && !/:$/.test(label)) {
      addUniqueSpec(specs, seen, label, value);
    }
  }

  // 4) Plain-text rows with a colon inside the explicit section.
  const rawLines = section.innerHTML
    .replace(BLOCK_ENDINGS, '\n')
    .replace(BREAKS, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\r?\n/)
    .map(normalizeText)
    .filter(Boolean);

  for (const line of rawLines) {
    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) {
      addUniqueSpec(specs, seen, match[1], match[2]);
      continue;
    }

    const known = matchKnownSpecLabel(line);
    if (known) addUniqueSpec(specs, seen, known.key, known.value);
  }
}

export function hasExplicitProductSpecifications(html: string): boolean {
  if (!html || typeof window === 'undefined') return false;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return findSpecificationHeadings(doc).length > 0;
}

export function extractProductSpecifications(html: string): ProductSpecification[] {
  if (!html || typeof window === 'undefined') return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = findSpecificationHeadings(doc);
  if (headings.length === 0) return [];

  const seen = new Set<string>();
  const specs: ProductSpecification[] = [];

  for (const heading of headings) {
    parseSpecificationSection(heading, specs, seen);
  }

  return specs;
}

export function removeSpecSection(html: string): string {
  if (!html || typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = findSpecificationHeadings(doc);

  for (const heading of headings) {
    const nodesToRemove: Element[] = [];
    let node: Element | null = heading;

    while (node) {
      if (node !== heading && isHeadingElement(node)) break;
      nodesToRemove.push(node);
      node = node.nextElementSibling as Element | null;
    }

    for (const item of nodesToRemove) item.remove();
  }

  return doc.body.innerHTML.trim();
}
