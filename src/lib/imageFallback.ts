const PRODUCT_FALLBACKS: Array<{ keywords: string[]; url: string }> = [
  { keywords: ['microphone', 'mic', 'rode', 'boya'], url: 'https://images.pexels.com/photos/31050364/pexels-photo-31050364.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['tripod', 'stand'], url: 'https://images.pexels.com/photos/11855189/pexels-photo-11855189.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['ring light', 'ringlight'], url: 'https://images.pexels.com/photos/30244806/pexels-photo-30244806.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['power bank', 'powerbank'], url: 'https://images.pexels.com/photos/4765366/pexels-photo-4765366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['phone holder', 'mobile holder', 'phone stand'], url: 'https://images.pexels.com/photos/12953565/pexels-photo-12953565.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['earbud', 'airpod', 'tws'], url: 'https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['cable', 'charging'], url: 'https://images.pexels.com/photos/18641665/pexels-photo-18641665.png?auto=compress&cs=tinysrgb&h=650&w=940' },
  { keywords: ['speaker', 'bluetooth'], url: 'https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' },
];

export function fallbackImage(name: string): string {
  const normalizedName = name.toLowerCase();
  const match = PRODUCT_FALLBACKS.find(({ keywords }) => keywords.some(keyword => normalizedName.includes(keyword)));
  return match?.url ?? 'https://images.pexels.com/photos/4765366/pexels-photo-4765366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
}

export function onImageError(e: React.SyntheticEvent<HTMLImageElement>, name = 'Product') {
  const img = e.currentTarget;
  if (!img.dataset.fallback) {
    img.dataset.fallback = '1';
    img.src = fallbackImage(name);
  }
}
