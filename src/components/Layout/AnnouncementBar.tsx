import { useSiteSettings } from '../../context/SiteSettingsContext';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const messages = [
    `WhatsApp: ${settings.whatsapp_number} — Send Your Order Details Directly`,
    ...settings.announcement_messages.split('|').map(s => s.trim()).filter(Boolean),
  ];
  // Content is duplicated once so the CSS animation can loop seamlessly
  // from -50% back to 0% with no visible seam.
  const track = [...messages, ...messages];

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
