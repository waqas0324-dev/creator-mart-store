import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { BRAND_NAME, toWhatsAppNumber } from '../../lib/brand';
import { Logo } from '../UI/Logo';
import { WhatsAppIcon } from '../UI/WhatsAppIcon';
import { TikTokIcon } from '../UI/TikTokIcon';

export function Footer() {
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();

  const socialLinks = [
    { url: settings.facebook_url, Icon: Facebook, label: 'Facebook' },
    { url: settings.instagram_url, Icon: Instagram, label: 'Instagram' },
    { url: settings.tiktok_url, Icon: TikTokIcon, label: 'TikTok' },
    { url: settings.youtube_url, Icon: Youtube, label: 'YouTube' },
  ].filter(s => s.url);

  const waNumber = toWhatsAppNumber(settings.whatsapp_number);
  const waLink = `https://wa.me/${waNumber}`;

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Stats */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: settings.footer_stat_1_value, label: settings.footer_stat_1_label },
            { value: settings.footer_stat_2_value, label: settings.footer_stat_2_label },
            { value: settings.footer_stat_3_value, label: settings.footer_stat_3_label },
            { value: settings.footer_stat_4_value, label: settings.footer_stat_4_label },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="mb-4">
            <Logo size="lg" showTagline={false} />
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {settings.footer_description}
          </p>
          <div className="flex gap-3">
            <a href={waLink} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
              <WhatsAppIcon size={14} />
            </a>
            {socialLinks.map(({ url, Icon, label }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-8 h-8 bg-gray-700 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-4">{settings.footer_quick_title}</h4>
          <ul className="space-y-2">
            {[
              { label: settings.footer_quick_home, page: 'home' as const },
              { label: settings.footer_quick_shop, page: 'shop' as const },
              { label: settings.footer_quick_new_arrivals, page: 'new-arrivals' as const },
              { label: settings.footer_quick_best_sellers, page: 'best-sellers' as const },
              { label: settings.footer_quick_contact, page: 'contact' as const },
              { label: settings.footer_quick_about, page: 'about' as const },
              { label: settings.footer_quick_return, page: 'return-policy' as const },
              { label: settings.footer_quick_privacy, page: 'privacy-policy' as const },
            ].map(link => (
              <li key={link.label}>
                <button
                  onClick={() => navigate(link.page)}
                  className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="text-white font-bold mb-4">{settings.footer_categories_title}</h4>
          <ul className="space-y-2">
            {settings.footer_categories.split('|').map(cat => cat.trim()).filter(Boolean).map(cat => (
              <li key={cat}>
                <button
                  onClick={() => navigate('shop', { categorySlug: cat.toLowerCase().replace(/ /g, '-') })}
                  className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-bold mb-4">{settings.footer_contact_title}</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <Phone size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <a href={`tel:+${waNumber}`} className="hover:text-orange-400 transition-colors">{settings.whatsapp_number}</a>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <Mail size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <a href={`mailto:${settings.footer_email}`} className="hover:text-orange-400 transition-colors">{settings.footer_email}</a>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <span>{settings.store_address}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-gray-500 text-center">&copy; 2026 {BRAND_NAME}. {settings.footer_copyright}</p>
        </div>
      </div>
    </footer>
  );
}
