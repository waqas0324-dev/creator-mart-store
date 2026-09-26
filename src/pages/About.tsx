import { ShieldCheck, Truck, Users, Award } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { BRAND_NAME, toWhatsAppNumber } from '../lib/brand';
import { Logo } from '../components/UI/Logo';
import { useSEO } from '../hooks/useSEO';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function About() {
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();
  const WHATSAPP_LINK = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  useSEO({
    title: `About Us | ${BRAND_NAME}`,
    description: `Learn about ${BRAND_NAME} — Pakistan's trusted store for content-creator gear. Premium quality, affordable prices, fast delivery nationwide.`,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">About Us</span>
        </div>
      </div>

      <div className="bg-[#111827] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-5"><Logo size="lg" /></div>
          <h1 className="text-white text-3xl font-black mb-3">About {BRAND_NAME}</h1>
          <p className="text-gray-400">
            Premium quality gear for content creators, all over Pakistan — cameras accessories,
            microphones, lighting, and everything you need to gear up your creativity.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {[
            { Icon: Award, title: '100% Original Products', desc: 'Every product we sell is genuine — no compromises on quality.' },
            { Icon: Truck, title: 'Fast Delivery, All Over Pakistan', desc: 'Reliable delivery to every city, with Cash on Delivery available.' },
            { Icon: ShieldCheck, title: '7 Days Easy Returns', desc: "Not happy with your order? Return it within 7 days, no questions asked." },
            { Icon: Users, title: 'Built for Creators', desc: 'We hand-pick gear that helps you make better content — from mics to lighting.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-5">
              <Icon className="text-orange-500 mb-3" size={28} />
              <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
          <h2 className="font-black text-gray-900 text-lg mb-2">Questions? We're here to help.</h2>
          <p className="text-sm text-gray-500 mb-4">Reach out any time — we typically reply within minutes on WhatsApp.</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Chat With Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
