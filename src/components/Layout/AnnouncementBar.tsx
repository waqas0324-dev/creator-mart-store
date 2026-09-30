import { useSiteSettings } from '../../context/SiteSettingsContext';

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  if (!settings.announcement_enabled) return null;
  const messages = [
    ...(settings.announcement_whatsapp_enabled ? [`WhatsApp: ${settings.whatsapp_number} — Send Your Order Details Directly`] : []),
    ...settings.announcement_messages.split('|').map(s => s.trim()).filter(Boolean),
  ];
  if (!messages.length) return null;
  const track=[...messages,...messages]; const bar=settings.design_settings.announcementBar;
  return <div className="bg-black text-white overflow-hidden flex items-center" aria-label="Store announcements" style={{minHeight:bar.height,paddingLeft:bar.horizontalPadding,paddingRight:bar.horizontalPadding}}>
    <div className="flex whitespace-nowrap animate-marquee w-max">
      {track.map((msg,i)=><span key={i} className="flex items-center uppercase tracking-wide text-gray-100" style={{fontSize:bar.fontSize,fontWeight:bar.fontWeight,paddingLeft:bar.horizontalPadding,paddingRight:bar.horizontalPadding}}>{msg}<span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-6 flex-shrink-0"/></span>)}
    </div>
  </div>;
}
