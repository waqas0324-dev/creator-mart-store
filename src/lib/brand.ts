export const BRAND_NAME = 'ABR Gadgets';
export const BRAND_TAGLINE = 'Gear Up Your Creativity';
export const BRAND_LOGO = '/images/logo/abr-gadgets.png';
// Default fallback only. The live, editable WhatsApp number lives in
// Developer Studio (site_settings.whatsapp_number) — use useSiteSettings()
// wherever possible instead of this constant.
export const WHATSAPP_NUMBER = '03484800547';
export const WHATSAPP_LINK = 'https://wa.me/923484800547';

/** Normalize a Pakistani phone number (0300xxxxxxx) into wa.me international format (923xxxxxxxxx) */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '92' + digits.slice(1);
  if (digits.startsWith('92')) return digits;
  return digits;
}
