import { BRAND_NAME, toWhatsAppNumber } from '../../lib/brand';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { WhatsAppIcon } from './WhatsAppIcon';

export function FloatingWhatsApp() {
  const { settings } = useSiteSettings();
  const message = encodeURIComponent(`Hi ${BRAND_NAME}! I have a question.`);
  const link = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  return (
    <a
      href={`${link}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white flex items-center justify-center shadow-lg shadow-black/30 transition-transform hover:scale-110"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
