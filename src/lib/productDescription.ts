// Specification extraction v5
// The product description is the ONLY source for the specification table.
// A table is created only when the description contains an explicit
// Specifications / Technical Specifications / Product Specifications heading.
// No keywords, features, tags, SEO text, or old database rows are used.

export type ProductSpecification = { key: string; value: string };

const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?)$/i;

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function isSpecHeading(el: Element): boolean {
  return SPEC_HEADINGS.test(normalizeText(el.textContent || ''));
}

function isHeading(el: Element): boolean {
  return /^H[1-6]$/.test(el.tagName);
}

function addUniqueSpec(
  specs: ProductSpecification[],
  seenKeys: Set<string>,
  key: string,
  value: string,
) {
  const cleanKey = normalizeText(key).replace(/:$/, '');
  const cleanValue = normalizeText(value);
  if (!cleanKey || !cleanValue || cleanValue.length < 2) return;

  const keySignature = cleanKey.toLowerCase();
  if (seenKeys.has(keySignature)) return;

  seenKeys.add(keySignature);
  specs.push({ key: cleanKey, value: cleanValue });
}

function getSectionNodes(heading: Element): Element[] {
  const wrapper = document.createElement('div');
  let node = heading.nextSibling;

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE && isHeading(node as Element)) break;
    wrapper.appendChild(node.cloneNode(true));
    node = node.nextSibling;
  }

  return [wrapper];
}

function parseSpecificationSection(
  heading: Element,
  specs: ProductSpecification[],
  seenKeys: Set<string>,
) {
  const [section] = getSectionNodes(heading);

  // 1) Real HTML table rows.
  for (const row of Array.from(section.querySelectorAll('tr'))) {
    const cells = Array.from(row.querySelectorAll('th,td'))
      .map(cell => normalizeText(cell.textContent || ''))
      .filter(Boolean);

    if (cells.length >= 2) {
      // Skip a generic table header instead of turning it into a spec row.
      if (/^specification$/i.test(cells[0]) && /^details?$/i.test(cells[1])) continue;
      addUniqueSpec(specs, seenKeys, cells[0], cells.slice(1).join(' '));
    }
  }

  // 2) Rich-text label/value pairs.
  const strongNodes = Array.from(section.querySelectorAll('strong,b'));
  for (let i = 0; i < strongNodes.length; i++) {
    const label = normalizeText(strongNodes[i].textContent || '');
    if (!label || /^(specification|specifications|details|specification details)$/i.test(label)) continue;

    const next = strongNodes[i + 1];
    let value = '';

    if (next) {
      const range = document.createRange();
      range.setStartAfter(strongNodes[i]);
      range.setEndBefore(next);
      value = normalizeText(range.cloneContents().textContent || '');
    } else {
      const range = document.createRange();
      range.setStartAfter(strongNodes[i]);
      range.setEndAfter(section.lastChild || strongNodes[i]);
      value = normalizeText(range.cloneContents().textContent || '');
    }

    if (value) addUniqueSpec(specs, seenKeys, label, value);
  }

  if (specs.length > 0) return;

  // 3) Plain-text specification rows.
  // Supports both "Label: Value" and "Label<TAB>Value" formats.
  // These are accepted ONLY inside the explicit specification section.
  const raw = section.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  for (const line of raw.split(/\r?\n/).map(normalizeText).filter(Boolean)) {
    const tabMatch = line.split(/\t+/).map(normalizeText).filter(Boolean);
    if (tabMatch.length >= 2) {
      if (/^specification$/i.test(tabMatch[0]) && /^details?$/i.test(tabMatch[1])) continue;
      addUniqueSpec(specs, seenKeys, tabMatch[0], tabMatch.slice(1).join(' '));
      continue;
    }

    const pipeMatch = line.split(/\s*\|\s*/).map(normalizeText).filter(Boolean);
    if (pipeMatch.length >= 2) {
      if (/^specification$/i.test(pipeMatch[0]) && /^details?$/i.test(pipeMatch[1])) continue;
      addUniqueSpec(specs, seenKeys, pipeMatch[0], pipeMatch.slice(1).join(' '));
      continue;
    }

    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) addUniqueSpec(specs, seenKeys, match[1], match[2]);
  }
}

function findSpecificationHeadings(doc: Document): Element[] {
  return Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div'))
    .filter(isSpecHeading);
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

  const specs: ProductSpecification[] = [];
  const seenKeys = new Set<string>();

  for (const heading of headings) {
    parseSpecificationSection(heading, specs, seenKeys);
  }

  return specs;
}

export function removeSpecSection(html: string): string {
  if (!html || typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = findSpecificationHeadings(doc);

  for (const heading of headings) {
    const nodesToRemove: Node[] = [];
    let node: Node | null = heading;

    while (node) {
      if (node !== heading && node.nodeType === Node.ELEMENT_NODE && isHeading(node as Element)) break;
      nodesToRemove.push(node);
      node = node.nextSibling;
    }

    for (const item of nodesToRemove) item.remove();
  }

  return doc.body.innerHTML.trim();
}
