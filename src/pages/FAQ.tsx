import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { BRAND_NAME, toWhatsAppNumber } from '../lib/brand';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSEO } from '../hooks/useSEO';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'We deliver all over Pakistan in 2–5 working days, depending on your city. Karachi, Lahore and Islamabad are usually fastest (2–3 days).',
  },
  {
    q: 'What are the delivery charges?',
    a: 'Delivery charges are shown at checkout before you confirm your order. Orders above a certain amount qualify for discounted or free delivery during promotions.',
  },
  {
    q: 'Do you offer Cash on Delivery (COD)?',
    a: 'Yes! COD is available nationwide. For some COD orders we ask for a small advance delivery fee before dispatch — the remaining amount you pay in cash when your parcel arrives.',
  },
  {
    q: 'How do I order on WhatsApp?',
    a: 'Tap the "Order on WhatsApp" button on any product page — it opens WhatsApp with your order details pre-filled. Just press send, and our team confirms your order within a few hours.',
  },
  {
    q: 'What is your return policy?',
    a: 'You can return unused items in original packaging within 7 days of delivery. If your order arrives damaged or wrong, contact us within 48 hours with photos for a free replacement or full refund.',
  },
  {
    q: 'Are your products 100% original?',
    a: 'Yes. Every product we sell is genuine and quality-checked before dispatch. If anything arrives faulty, our replacement policy covers you.',
  },
  {
    q: 'How can I track my order?',
    a: 'Use the Track Order page in the menu and enter your order number. You\'ll see live status updates from dispatch to doorstep.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'Cash on Delivery, bank transfer, JazzCash and Easypaisa. Advance payments get free delivery plus an extra discount on most orders.',
  },
];

export function FAQ() {
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const WHATSAPP_LINK = `https://wa.me/${toWhatsAppNumber(settings.whatsapp_number)}`;

  useSEO({
    title: `FAQ | ${BRAND_NAME}`,
    description: `Frequently asked questions about ${BRAND_NAME}: delivery time and charges, Cash on Delivery, WhatsApp ordering, returns and tracking.`,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">FAQ</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 mb-8">Quick answers to the questions our customers ask most.</p>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIndex === i;
            return (
              <div key={f.q} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{f.q}</span>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-orange-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Still have a question? We're one message away.</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm">
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
