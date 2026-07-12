export function AnnouncementBar() {
  const message = [
    '📦 Cash on Delivery Available — Rs. 500 Advance Required for Order Confirmation',
    '📱 JazzCash Number: 03245240920 — Send Payment Screenshot on WhatsApp After Transfer',
    '🚚 Fast Delivery All Over Pakistan',
    '✅ 7 Days Easy Return Policy',
    '🎉 Up to 40% OFF on Selected Items — Shop Now!',
    '📦 Cash on Delivery Available — Rs. 500 Advance Required for Order Confirmation',
    '📱 JazzCash Number: 03245240920 — Send Payment Screenshot on WhatsApp After Transfer',
    '🚚 Fast Delivery All Over Pakistan',
    '✅ 7 Days Easy Return Policy',
    '🎉 Up to 40% OFF on Selected Items — Shop Now!',
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
