import { WHATSAPP_NUMBER } from '../../lib/brand';

const MESSAGES = [
  `WhatsApp: ${WHATSAPP_NUMBER} — Send Your Order Details Directly`,
  'Free Delivery All Over Pakistan',
  'New Products Added Every Week',
  'Follow Us for Daily Deals & Discounts',
];

export function AnnouncementBar() {
  // Content is duplicated once so the CSS animation can loop seamlessly
  // from -50% back to 0% with no visible seam.
  const track = [...MESSAGES, ...MESSAGES];

  return (
    <div className="bg-black text-white py-2 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {track.map((msg, i) => (
          <span key={i} className="flex items-center text-[11px] font-semibold uppercase tracking-wide text-gray-200 px-6">
            {msg}
            <span className="w-1 h-1 rounded-full bg-orange-500 ml-6" />
          </span>
        ))}
      </div>
    </div>
  );
}
