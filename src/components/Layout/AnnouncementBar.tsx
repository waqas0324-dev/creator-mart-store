import { WHATSAPP_NUMBER } from '../../lib/brand';

export function AnnouncementBar() {
  const message = [
    'Cash on Delivery Available — Confirm your order with ease',
    `WhatsApp: ${WHATSAPP_NUMBER} — Send your order details directly`,
    'Fast delivery all over Pakistan',
    '7 days easy return policy',
    'Selected deals available now — shop your favourites',
    'Cash on Delivery Available — Confirm your order with ease',
    `WhatsApp: ${WHATSAPP_NUMBER} — Send your order details directly`,
    'Fast delivery all over Pakistan',
    '7 days easy return policy',
    'Selected deals available now — shop your favourites',
  ];

  return (
    <div className="bg-orange-500 text-white overflow-hidden py-2 select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {message.map((item, i) => (
          <span key={i} className="text-sm font-semibold mx-8 flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
