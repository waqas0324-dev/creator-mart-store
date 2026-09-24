const FALLBACK = '/images/placeholder.jpg';

export function resolveProductImage(url: string | null | undefined): string {
  if (!url) return FALLBACK;
  return url;
}

export function resolveCategoryImage(url: string | null | undefined): string {
  if (!url) return FALLBACK;
  return url;
}

export function onImageError(e: React.SyntheticEvent<HTMLImageElement>, _name = 'Product') {
  const img = e.currentTarget;
  if (!img.dataset.fallback) {
    img.dataset.fallback = '1';
    img.src = FALLBACK;
  }
}
