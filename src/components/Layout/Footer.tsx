import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { BRAND_LOGO, WHATSAPP_LINK, WHATSAPP_NUMBER } from '../../lib/brand';

export function Footer() {
  const { navigate } = useNavigation();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Stats */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '300+', label: 'Quality Products' },
            { value: '99%', label: 'Positive Reviews' },
            { value: '24/7', label: 'Customer Support' },
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
          <div className="flex items-center gap-2 mb-4">
            <img src={BRAND_LOGO} alt="ABR Gadgets" className="w-40 h-16 object-contain mix-blend-screen" />
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Pakistan's No.1 Creator Store. Premium quality products for content creators delivered nationwide.
          </p>
          <div className="flex gap-3">
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="w-8 h-8 bg-gray-700 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors">
              <MessageCircle size={14} />
            </a>
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <button key={i} className="w-8 h-8 bg-gray-700 hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors">
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            {[
              { label: 'Home', page: 'home' as const },
              { label: 'Shop', page: 'shop' as const },
              { label: 'Flash Deals', page: 'flash-deals' as const },
              { label: 'New Arrivals', page: 'new-arrivals' as const },
              { label: 'Best Sellers', page: 'best-sellers' as const },
              { label: 'Contact Us', page: 'contact' as const },
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
          <h4 className="text-white font-bold mb-4">Categories</h4>
          <ul className="space-y-2">
            {['Microphones', 'Tripods', 'Ring Lights', 'Power Banks', 'Earbuds', 'Speakers'].map(cat => (
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
          <h4 className="text-white font-bold mb-4">Contact Us</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <Phone size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <a href={`tel:+92${WHATSAPP_NUMBER.slice(1)}`} className="hover:text-orange-400 transition-colors">+92 304 4454356</a>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <Mail size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <a href="mailto:info@creatormart.pk" className="hover:text-orange-400 transition-colors">info@creatormart.pk</a>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin size={14} className="mt-0.5 text-orange-400 flex-shrink-0" />
              <span>Plaza 145-B Commercial, Jasmine Block, Bahria Town, Lahore</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-gray-500 text-center">&copy; 2026 ABR Gadgets. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
