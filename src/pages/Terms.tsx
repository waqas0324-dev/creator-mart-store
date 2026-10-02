import { useNavigation } from '../context/NavigationContext';
import { BRAND_NAME, toWhatsAppNumber } from '../lib/brand';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSEO } from '../hooks/useSEO';

const SECTIONS = [
  {
    title: 'Orders',
    body: 'When you place an order with us — through the website checkout or WhatsApp — we confirm availability and then dispatch your parcel. Please double-check your name, phone number and delivery address before submitting, because wrong details are the most common cause of delayed deliveries.',
  },
  {
    title: 'Prices & Payment',
    body: 'All prices are listed in Pakistani Rupees (PKR) and include any active discounts shown on the product. We accept Cash on Delivery (COD), bank transfer and mobile wallet payments (JazzCash / Easypaisa). For COD orders, a small advance delivery fee may be required before dispatch — this is adjusted in your final bill.',
  },
  {
    title: 'Delivery',
    body: 'We deliver all over Pakistan, usually within 2–5 working days depending on your city. Delivery charges are shown at checkout before you confirm your order. Once dispatched, you can track your order from the Track Order page using your order number.',
  },
  {
    title: 'Returns & Refunds',
    body: 'We offer a 7-day return window for unused items in original packaging. If your order arrives damaged or you received the wrong item, contact us within 48 hours with photos for a free replacement or full refund. Full details are on our Return & Refund Policy page.',
  },
  {
    title: 'Product Information',
    body: 'We work hard to show accurate product descriptions, images, specifications and prices. In the rare case of a typo or pricing error, we will contact you before dispatch to confirm — you are always free to cancel in that situation.',
  },
  {
    title: 'Fair Use',
    body: 'Please use our website and WhatsApp ordering honestly. Fake orders, prank COD bookings or abuse of our support team may lead to your number being blocked from future orders.',
  },
  {
    title: 'Contact Us',
    body: 'Questions about these terms? Message us anytime on WhatsApp or visit our Contact page — a real human replies, usually within a few hours.',
  },
];

export function Terms() {
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();
  const WHATSAPP_LINK = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  useSEO({
    title: `Terms & Conditions | ${BRAND_NAME}`,
    description: `Read the ${BRAND_NAME} terms and conditions: orders, payment, delivery, returns and fair use policy.`,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Terms &amp; Conditions</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-2">Terms &amp; Conditions</h1>
        <p className="text-gray-500 mb-8">The simple rules of shopping with {BRAND_NAME} — no legal jargon.</p>

        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1.5">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Have a question about these terms? Ask us directly.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
