// Specification extraction v5
// The product description is the ONLY source for the specification table.
// A table is created only when the description contains an explicit
// Specifications / Technical Specifications / Product Specifications heading.
// No keywords, features, tags, SEO text, or old database rows are used.

export type ProductSpecification = { key: string; value: string };

const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?)$/i;
const FAQ_HEADINGS = /^(frequently asked questions?|faq|faqs)$/i;
const DESCRIPTION_SECTION_HEADINGS = /^(product description|description|key features?|features?|technical specifications?|specifications?|product specifications?|applications?(?:\s*&\s*|\s+and\s+)use cases?|why choose(?: us| this product)?|frequently asked questions?|faq|faqs)$/i;

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function isSpecHeading(el: Element): boolean {
  return SPEC_HEADINGS.test(normalizeText(el.textContent || ''));
}

function isFaqHeading(el: Element): boolean {
  return FAQ_HEADINGS.test(normalizeText(el.textContent || ''));
}

function isHeading(el: Element): boolean {
  return /^H[1-6]$/.test(el.tagName);
}

function isDescriptionSectionHeading(el: Element): boolean {
  return DESCRIPTION_SECTION_HEADINGS.test(normalizeText(el.textContent || ''));
}

function isSectionBoundary(el: Element): boolean {
  return isHeading(el) || isDescriptionSectionHeading(el);
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
    if (node.nodeType === Node.ELEMENT_NODE && isSectionBoundary(node as Element)) break;
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

function findFaqHeadings(doc: Document): Element[] {
  return Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div'))
    .filter(isFaqHeading);
}

/** Normalize standard product section titles into bold semantic headings. */
export function normalizeProductDescriptionHtml(html: string): string {
  if (!html || typeof window === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const candidates = Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div'));

  for (const el of candidates) {
    const text = normalizeText(el.textContent || '');
    if (!text || !DESCRIPTION_SECTION_HEADINGS.test(text)) continue;

    const heading = /^H[1-6]$/.test(el.tagName) ? el : doc.createElement('h3');
    if (heading !== el) el.replaceWith(heading);

    heading.innerHTML = '';
    const strong = doc.createElement('strong');
    strong.textContent = text;
    heading.appendChild(strong);
  }

  return doc.body.innerHTML.trim();
}

export type ProductFaq = {
  question: string;
  answerHtml: string;
};

function cleanFaqQuestion(value: string): string {
  return normalizeText(value).replace(/^(?:q|question)\s*:\s*/i, '').trim();
}

function extractFaqFromBlock(block: Element): ProductFaq | null {
  const strong = block.querySelector('strong,b');

  if (strong) {
    const questionText = normalizeText(strong.textContent || '');
    if (/^(?:q|question)\s*:/i.test(questionText)) {
      const question = cleanFaqQuestion(questionText);
      const clone = block.cloneNode(true) as Element;
      const cloneStrong = clone.querySelector('strong,b');
      cloneStrong?.remove();
      const answerHtml = clone.innerHTML.replace(/^\s*(?:<br\s*\/?>\s*)+/i, '').trim();
      return question && answerHtml ? { question, answerHtml } : null;
    }
  }

  const raw = (block.innerHTML || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const lines = raw.split(/\r?\n/).map(normalizeText).filter(Boolean);
  const qIndex = lines.findIndex(line => /^(?:q|question)\s*:/i.test(line));
  if (qIndex === -1) return null;

  const question = cleanFaqQuestion(lines[qIndex]);
  const answer = lines.slice(qIndex + 1).join(' ').trim();
  return question && answer ? { question, answerHtml: answer } : null;
}

function parseFaqSection(heading: Element, faqs: ProductFaq[]) {
  const [section] = getSectionNodes(heading);
  const seen = new Set<string>();

  for (const block of Array.from(section.querySelectorAll('p,li,div'))) {
    const faq = extractFaqFromBlock(block);
    if (!faq) continue;
    const signature = faq.question.toLowerCase();
    if (seen.has(signature)) continue;
    seen.add(signature);
    faqs.push(faq);
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

export function hasExplicitProductFaqs(html: string): boolean {
  if (!html || typeof window === 'undefined') return false;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return findFaqHeadings(doc).length > 0;
}

export function extractProductFaqs(html: string): ProductFaq[] {
  if (!html || typeof window === 'undefined') return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = findFaqHeadings(doc);
  if (headings.length === 0) return [];
  const faqs: ProductFaq[] = [];
  for (const heading of headings) parseFaqSection(heading, faqs);
  return faqs;
}

export function removeFaqSection(html: string): string {
  if (!html || typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = findFaqHeadings(doc);

  for (const heading of headings) {
    const nodesToRemove: Node[] = [];
    let node: Node | null = heading;
    while (node) {
      if (node !== heading && node.nodeType === Node.ELEMENT_NODE && isSectionBoundary(node as Element)) break;
      nodesToRemove.push(node);
      node = node.nextSibling;
    }
    for (const item of nodesToRemove) item.remove();
  }

  return doc.body.innerHTML.trim();
}