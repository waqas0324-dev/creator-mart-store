export const BRAND_NAME = 'ABR Gadgets';
export const BRAND_TAGLINE = 'Gear Up Your Creativity';
export const BRAND_LOGO = '/images/logo/abr-gadgets.png';
export const WHATSAPP_NUMBER = '03044454356';
export const WHATSAPP_LINK = 'https://wa.me/923044454356';

/** Normalize a Pakistani phone number (0300xxxxxxx) into wa.me international format (923xxxxxxxxx) */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  if (digits.startsWith('92')) return digits;
  return digits;
}
