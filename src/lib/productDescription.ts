// Product description is the single source of truth for specification rows.
// Only content inside an explicit Specifications section is converted into the table.
// All other description content (headings, features, usage, notes, etc.) stays in the
// rich description exactly as entered by the admin.

export type ProductSpecification = { key: string; value: string };

const BLOCK_ENDINGS = /<\/(?:p|li|h1|h2|h3|h4|h5|h6|div|blockquote|tr)>/gi;
const BREAKS = /<br\s*\/?>/gi;
const SPEC_HEADINGS = /^(specifications?|technical specifications?|product specifications?)$/i;
const ANY_HEADING = /^(?:h1|h2|h3|h4|h5|h6)$/i;

export function extractProductSpecifications(html: string): ProductSpecification[] {
  if (!html || typeof window === 'undefined') return [];

  // Mark headings before converting HTML to plain text so we can distinguish the
  // actual Specifications section from normal "Label: Value" text elsewhere.
  const marked = html
    .replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, '\n@@HEADING@@$2@@END_HEADING@@\n')
    .replace(BLOCK_ENDINGS, '\n')
    .replace(BREAKS, '\n');

  const doc = new DOMParser().parseFromString(marked, 'text/html');
  const rawLines = (doc.body.textContent || '')
    .split(/\r?\n/)
    .map(line => line.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const specs: ProductSpecification[] = [];
  let specificationMode = false;

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
    const headingMatch = originalLine.match(/^@@HEADING@@([\s\S]*?)@@END_HEADING@@$/i);

    if (headingMatch) {
      const heading = headingMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Enter specification mode only for an explicit Specifications heading.
      // Any other heading closes specification mode.
      specificationMode = SPEC_HEADINGS.test(heading);
      continue;
    }

    if (!specificationMode) continue;

    const line = originalLine.replace(/^[•●▪◦*-]\s*/, '').trim();
    const match = line.match(/^([^:]{2,80}):\s*(.{2,300})$/);

    if (match) {
      addSpec(match[1], match[2]);
    }
  }

  return specs;
}
