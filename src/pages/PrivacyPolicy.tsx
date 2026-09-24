import { useNavigation } from '../context/NavigationContext';
import { BRAND_NAME } from '../lib/brand';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'When you place an order, we collect your name, phone number, email (optional), and delivery address — only what is needed to process and deliver your order.',
  },
  {
    title: 'How We Use Your Information',
    body: 'Your details are used solely to fulfil your order, contact you about delivery, and respond to your questions. We do not sell or rent your information to third parties.',
  },
  {
    title: 'Payment Information',
    body: 'For Cash on Delivery, no payment details are collected online. For bank transfer or JazzCash/Easypaisa payments, we never ask for your card PIN or account password — only a payment confirmation screenshot.',
  },
  {
    title: 'WhatsApp Communication',
    body: `If you contact us or place an order, we may message you on WhatsApp regarding your order status. You can ask us to stop at any time.`,
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions about this policy or how your data is handled, reach out to us any time via WhatsApp or the Contact page.',
  },
];

export function PrivacyPolicy() {
  const { navigate } = useNavigation();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Privacy Policy</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Your privacy matters to us. Here's how {BRAND_NAME} handles your information.</p>

        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.title} className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-1.5">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
