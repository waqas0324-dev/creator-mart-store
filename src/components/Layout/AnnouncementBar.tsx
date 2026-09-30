import { useSiteSettings } from '../../context/SiteSettingsContext';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const d = settings.design_settings.announcementBar;
  if (!settings.announcement_enabled) return null;

  const messages = [
    ...(settings.announcement_whatsapp_enabled
      ? [`WhatsApp: ${settings.whatsapp_number} — Send Your Order Details Directly`]
      : []),
    ...settings.announcement_messages.split('|').map(s => s.trim()).filter(Boolean),
  ];
  if (!messages.length) return null;

  const track = [...messages, ...messages];

  return (
    <div style={{ backgroundColor: d.backgroundColor, color: d.textColor, minHeight: d.height }} className="overflow-hidden flex items-center" aria-label="Store announcements">
      <div className="flex whitespace-nowrap animate-marquee">
        {track.map((msg, i) => (
          <span key={i} style={{ fontSize: d.fontSize, fontWeight: d.fontWeight, color: d.textColor, paddingLeft: d.paddingX, paddingRight: d.paddingX }} className="flex items-center uppercase tracking-wide py-2">
            {msg}
            <span style={{ backgroundColor: d.accentColor }} className="w-1.5 h-1.5 rounded-full ml-6 flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}
