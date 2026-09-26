import { useNavigation } from '../context/NavigationContext';
import { BRAND_NAME, toWhatsAppNumber } from '../lib/brand';
import { useSiteSettings } from '../context/SiteSettingsContext';

const SECTIONS = [
  {
    title: '7-Day Return Window',
    body: 'You can request a return within 7 days of receiving your order. To be eligible, the item must be unused, in its original packaging, and in the same condition you received it.',
  },
  {
    title: 'How to Request a Return',
    body: `Message us on WhatsApp with your order number and the reason for the return. We'll guide you through the next steps — no long forms, no hassle.`,
  },
  {
    title: 'Damaged or Wrong Item',
    body: 'If your order arrives damaged, or you received the wrong item, contact us within 48 hours of delivery with photos — we will arrange a free replacement or full refund.',
  },
  {
    title: 'Refunds',
    body: 'Once your return is received and inspected, we will notify you of the approval status. Approved refunds are processed to your original payment method, or as store credit if you prefer, within 5–7 business days.',
  },
  {
    title: 'Non-Returnable Items',
    body: 'For hygiene reasons, items like earbuds and in-ear accessories can only be returned if unopened and in original sealed packaging.',
  },
];

export function ReturnPolicy() {
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();
  const WHATSAPP_LINK = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Return &amp; Refund Policy</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-2">Return &amp; Refund Policy</h1>
        <p className="text-gray-500 mb-8">Shop with confidence — here's exactly how returns and refunds work at {BRAND_NAME}.</p>

        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1.5">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Need to start a return? Message us directly.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
            Start a Return on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
