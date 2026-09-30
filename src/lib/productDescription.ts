export interface DescriptionRow { label: string; value: string; }
export interface DescriptionBlock {
  type: 'intro' | 'heading' | 'paragraph' | 'features' | 'specs' | 'included' | 'perfect_for';
  title: string;
  text?: string;
  items?: string[];
  rows?: DescriptionRow[];
}
export interface ProductDescriptionDocument {
  version: 1;
  style: {
    headingBg: string;
    headingText: string;
    accent: string;
    tableBorder: string;
    sectionBg: string;
  };
  blocks: DescriptionBlock[];
}

export const DESCRIPTION_PREFIX = 'ABR_DESC_V1:';

export const defaultDescriptionStyle: ProductDescriptionDocument['style'] = {
  headingBg: '#f3f4f6',
  headingText: '#111827',
  accent: '#f97316',
  tableBorder: '#e5e7eb',
  sectionBg: '#ffffff',
};

export function createDefaultDescription(): ProductDescriptionDocument {
  return { version: 1, style: { ...defaultDescriptionStyle }, blocks: [] };
}

export function parseProductDescription(raw: string | null | undefined): ProductDescriptionDocument | null {
  if (!raw?.startsWith(DESCRIPTION_PREFIX)) return null;
  try {
    const parsed = JSON.parse(raw.slice(DESCRIPTION_PREFIX.length));
    if (parsed?.version === 1 && Array.isArray(parsed.blocks)) {
      return {
        version: 1,
        style: { ...defaultDescriptionStyle, ...(parsed.style || {}) },
        blocks: parsed.blocks,
      };
    }
  } catch {}
  return null;
}

export function serializeProductDescription(doc: ProductDescriptionDocument): string {
  return DESCRIPTION_PREFIX + JSON.stringify(doc);
}

export function getPlainProductDescription(raw: string | null | undefined): string {
  const doc = parseProductDescription(raw);
  if (!doc) return raw || '';
  return doc.blocks.map(block => {
    if (block.type === 'specs' && block.rows) return block.rows.map(row => row.label + ': ' + row.value).join('. ');
    if (block.items) return block.items.join('. ');
    return [block.title, block.text].filter(Boolean).join(': ');
  }).filter(Boolean).join('\n\n');
}
