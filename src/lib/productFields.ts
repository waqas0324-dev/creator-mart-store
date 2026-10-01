import { supabase } from './supabase';

// The products table may or may not have the newer columns (mini_description, tags)
// depending on whether the migration has been applied. Detect once and cache,
// so the storefront keeps working on older databases too.
let newColumnsSupported: boolean | null = null;

export async function productsSupportNewColumns(): Promise<boolean> {
  if (newColumnsSupported !== null) return newColumnsSupported;
  try {
    const { error } = await supabase.from('products').select('mini_description,tags').limit(1);
    newColumnsSupported = !error || !/column/i.test(error.message || '');
  } catch {
    newColumnsSupported = false;
  }
  return newColumnsSupported;
}

export function isMissingColumnError(error: { message?: string } | null | undefined): boolean {
  return !!error && /column/i.test(error.message || '');
}

/** Decode common HTML entities (descriptions are stored with &nbsp; etc). */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)));
}

/** Strip tags, decode entities and collapse whitespace into plain text. */
export function htmlToText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/[\u00a0\s]+/g, ' ')
    .trim();
}

/** Mini description: manual value (max 220 chars) or a safe fallback from the main description. */
export function getMiniDescription(product: {
  mini_description?: string | null;
  description?: string;
}): string {
  const manual = (product.mini_description || '').trim();
  if (manual) return manual.slice(0, 220);
  const text = htmlToText(product.description || '').replace(
    /^Product Description\s+/i,
    ''
  );
  return text.slice(0, 220);
}

/** Normalize the tags value into a clean string array. */
export function getProductTags(product: { tags?: unknown }): string[] {
  if (!Array.isArray(product.tags)) return [];
  return (product.tags as unknown[])
    .map(tag => String(tag).trim())
    .filter(Boolean);
}
