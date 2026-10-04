// Product description parsing and normalization.
// The description is the single source of truth for specifications and FAQs.
// A specification table is rendered only when an explicit specification heading exists.

export type ProductSpecification = { key: string; value: string };

const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?)$/i;
const FAQ_HEADINGS = /^(frequently asked questions?|faq|faqs)$/i;
const DESCRIPTION_SECTION_HEADINGS = /^(product description|description|key features?|features?|technical specifications?|specifications?|product specifications?|applications?(?:\s*&\s*|\s+and\s+)use cases?|why choose(?: us| this product| the .+)?|frequently asked questions?|faq|faqs|perfect for (?:multiple uses|content creation and photography)|ideal for multiple uses|what(?:'|’)?s included(?: in the package| in the box)?|compatible software and applications|multiple applications|buy .+ in pakistan)$/i;

const SPEC_LABELS = [
  'Maximum Center Tube Diameter', 'Maximum Load Capacity', 'Maximum Height',
  'Minimum Height', 'Adjustable Height', 'Folded Length', 'Number of Leg Sections',
  'Color Temperature', 'Color Rendering Index', 'Battery Capacity',
  'Battery Runtime', 'Battery Life', 'Product Type', 'Product Name',
  'Lighting Modes', 'Lighting Style', 'Lighting Type', 'Transmission Technology',
  'Transmission Distance', 'Receiver Variants', 'Microphone Quantity',
  'Microphone Configuration', 'Microphone Design', 'Audio Features',
  'Charging Port', 'Charging Time', 'Charging Case Battery', 'Microphone Battery',
  'Input Voltage', 'Rated Input', 'Output Power', 'Power Input', 'Main Usage',
  'Phone Holder', 'Phone Clip', 'Remote Control', 'Carrying Bag', 'Panel Size',
  'Ring Diameter', 'Light Modes', 'Load Capacity', 'Brand', 'Model', 'Lighting',
  'Brightness', 'Brightness Control', 'Runtime', 'Working Time', 'Size',
  'Dimensions', 'Material', 'Design', 'RGB Lighting', 'Charging', 'Power',
  'Input', 'Output', 'Voltage', 'Wattage', 'Control', 'Usage', 'Compatibility',
  'Connectivity', 'Receiver', 'Microphone', 'LED Light', 'Tripod', 'Fabric',
  'Color', 'CRI', 'Frequency', 'Operation', 'Mounting', 'Feet',
  'Panoramic Rotation', 'Vertical Shooting', 'Suitable For', 'Pickup Pattern',
  'Noise Reduction', 'Battery Type', 'Microphone Weight', 'Total Weight',
  'Operating Range', 'Microphone Configuration', 'Microphone Quantity',
].sort((a, b) => b.length - a.length);

const SPEC_LABEL_PATTERN = new RegExp(
  '(' + SPEC_LABELS.map(label => label.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=\s*[:：]?\s*[A-Z0-9])',
  'gi'
);

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

function addUniqueSpec(specs: ProductSpecification[], seenKeys: Set<string>, key: string, value: string) {
  const cleanKey = normalizeText(key).replace(/:$/, '');
  const cleanValue = normalizeText(value).replace(/^[:：]\s*/, '');
  if (!cleanKey || !cleanValue || cleanValue.length < 2) return;
  const signature = cleanKey.toLowerCase();
  if (seenKeys.has(signature)) return;
  seenKeys.add(signature);
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

function parseConcatenatedSpecificationText(rawText: string, specs: ProductSpecification[], seenKeys: Set<string>) {
  const raw = normalizeText(rawText)
    .replace(/Specification\s*Details/i, '')
    .replace(/^Details\s*/i, '')
    .trim();

  if (!raw) return;

  const matches = Array.from(raw.matchAll(SPEC_LABEL_PATTERN));
  if (matches.length < 2) return;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const key = match[1];
    const valueStart = (match.index || 0) + match[0].length;
    const valueEnd = i + 1 < matches.length ? (matches[i + 1].index || raw.length) : raw.length;
    addUniqueSpec(specs, seenKeys, key, raw.slice(valueStart, valueEnd));
  }
}

function parseSpecificationSection(heading: Element, specs: ProductSpecification[], seenKeys: Set<string>) {
  const [section] = getSectionNodes(heading);

  for (const row of Array.from(section.querySelectorAll('tr'))) {
    const cells = Array.from(row.querySelectorAll('th,td'))
      .map(cell => normalizeText(cell.textContent || ''))
      .filter(Boolean);
    if (cells.length >= 2) {
      if (/^specification$/i.test(cells[0]) && /^details?$/i.test(cells[1])) continue;
      addUniqueSpec(specs, seenKeys, cells[0], cells.slice(1).join(' '));
    }
  }

  for (const strong of Array.from(section.querySelectorAll('strong,b'))) {
    const label = normalizeText(strong.textContent || '');
    if (!label || /^(specification|specifications|details|specification details)$/i.test(label)) continue;
    const parent = strong.parentElement;
    if (!parent) continue;
    const clone = parent.cloneNode(true) as Element;
    clone.querySelector('strong,b')?.remove();
    addUniqueSpec(specs, seenKeys, label, clone.textContent || '');
  }

  const raw = section.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  for (const line of raw.split(/\r?\n/).map(normalizeText).filter(Boolean)) {
    const tabMatch = line.split(/\t+/).map(normalizeText).filter(Boolean);
    if (tabMatch.length >= 2) {
      addUniqueSpec(specs, seenKeys, tabMatch[0], tabMatch.slice(1).join(' '));
      continue;
    }

    const pipeMatch = line.split(/\s*\|\s*/).map(normalizeText).filter(Boolean);
    if (pipeMatch.length >= 2) {
      addUniqueSpec(specs, seenKeys, pipeMatch[0], pipeMatch.slice(1).join(' '));
      continue;
    }

    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);
    if (match) addUniqueSpec(specs, seenKeys, match[1], match[2]);
  }

  // Recover source tables pasted as a single string such as
  // SpecificationDetailsBrandPlokamaModelU160Product TypePortable...
  if (/Specification\s*Details/i.test(raw)) {
    parseConcatenatedSpecificationText(raw, specs, seenKeys);
  }
}

function findSpecificationHeadings(doc: Document): Element[] {
  return Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div')).filter(isSpecHeading);
}

function findFaqHeadings(doc: Document): Element[] {
  return Array.from(doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div')).filter(isFaqHeading);
}

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

export type ProductFaq = { question: string; answerHtml: string };

function cleanFaqQuestion(value: string): string {
  return normalizeText(value).replace(/^(?:q|question)\s*:\s*/i, '').trim();
}

function isLikelyQuestion(text: string): boolean {
  const clean = normalizeText(text);
  return /\?$/.test(clean) || /^(?:what|why|how|is|are|can|does|do|will|which|where|when|who|should)\b/i.test(clean);
}

function makeFaq(question: string, answerHtml: string): ProductFaq | null {
  const q = cleanFaqQuestion(question);
  const answer = answerHtml.trim();
  return q && answer ? { question: q, answerHtml: answer } : null;
}

function extractFaqFromBlock(block: Element): ProductFaq | null {
  const strong = block.querySelector('strong,b');
  if (strong) {
    const questionText = normalizeText(strong.textContent || '');
    if (/^(?:q|question)\s*:/i.test(questionText)) {
      const clone = block.cloneNode(true) as Element;
      clone.querySelector('strong,b')?.remove();
      return makeFaq(questionText, clone.innerHTML.replace(/^\s*(?:<br\s*\/?>\s*)+/i, ''));
    }
  }

  const raw = (block.innerHTML || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const lines = raw.split(/\r?\n/).map(normalizeText).filter(Boolean);
  const qIndex = lines.findIndex(line => /^(?:q|question)\s*:/i.test(line));
  if (qIndex === -1) return null;
  return makeFaq(lines[qIndex], lines.slice(qIndex + 1).join(' '));
}

function parseFaqSection(heading: Element, faqs: ProductFaq[]) {
  const [section] = getSectionNodes(heading);
  const blocks = Array.from(section.querySelectorAll('p,li,div'));
  const seen = new Set<string>();

  // Format A: Q: question and answer in one block.
  for (const block of blocks) {
    const faq = extractFaqFromBlock(block);
    if (!faq) continue;
    const signature = faq.question.toLowerCase();
    if (!seen.has(signature)) {
      seen.add(signature);
      faqs.push(faq);
    }
  }

  // Format B: bold question paragraph followed by answer paragraph(s).
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const question = normalizeText(block.textContent || '');
    const strong = block.querySelector('strong,b');
    if (!strong || normalizeText(strong.textContent || '') !== question || !isLikelyQuestion(question)) continue;

    const answerParts: string[] = [];
    let j = i + 1;
    while (j < blocks.length) {
      const candidate = blocks[j];
      const candidateText = normalizeText(candidate.textContent || '');
      const candidateStrong = candidate.querySelector('strong,b');
      if (candidateStrong && normalizeText(candidateStrong.textContent || '') === candidateText && isLikelyQuestion(candidateText)) break;
      if (candidateText) answerParts.push(candidate.outerHTML || candidateText);
      j++;
    }

    const faq = makeFaq(question, answerParts.join(''));
    if (!faq) continue;
    const signature = faq.question.toLowerCase();
    if (!seen.has(signature)) {
      seen.add(signature);
      faqs.push(faq);
    }
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
  for (const heading of headings) parseSpecificationSection(heading, specs, seenKeys);
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
      if (node !== heading && node.nodeType === Node.ELEMENT_NODE && isSectionBoundary(node as Element)) break;
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
