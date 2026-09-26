import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Upload, Loader2, CheckCircle, ShieldCheck, LogOut, ExternalLink,
  Image, Menu, X, Layout, Sparkles, CreditCard, PanelBottom, MapPin, Share2
} from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';
import { devLogout } from '../../lib/devAuth';
import { useToast } from '../../context/ToastContext';
import { AccountSecurity } from '../../components/AccountSecurity';
import { AccountManagement } from '../../components/AccountManagement';
import type { DesignSettings, SiteSettings } from '../../types';

const LOGO_SIZE_OPTIONS: { value: SiteSettings['logo_size']; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

type Section = 'logo' | 'header' | 'hero' | 'buttons' | 'checkout' | 'footer' | 'contact' | 'social' | 'security';

const SECTIONS: { id: Section; label: string; icon: typeof Image; description: string }[] = [
  { id: 'logo', label: 'Logo', icon: Image, description: 'Logo image and sizing' },
  { id: 'header', label: 'Header / Navbar', icon: Menu, description: 'Height, colors, typography and borders' },
  { id: 'hero', label: 'Hero', icon: Layout, description: 'Hero banner, border and presentation' },
  { id: 'buttons', label: 'Buttons & Animations', icon: Sparkles, description: 'Button colors, radius and interactions' },
  { id: 'checkout', label: 'Checkout / Payment', icon: CreditCard, description: 'COD, advance payment and payment details' },
  { id: 'footer', label: 'Footer', icon: PanelBottom, description: 'All footer content and links' },
  { id: 'contact', label: 'Contact / Announcement', icon: MapPin, description: 'WhatsApp, address and top bar' },
  { id: 'social', label: 'Social Media', icon: Share2, description: 'Social profile links' },
  { id: 'security', label: 'Account & Security', icon: ShieldCheck, description: 'Private account, password and security activity' },
];

const ORIGINAL_DESIGN_SETTINGS: DesignSettings = {
  header: { height: 72, bgColor: '#111827', textColor: '#e5e7eb', hoverColor: '#fb923c', borderColor: '#1f2937', borderWidth: 1, fontSize: 14, fontWeight: 700 },
  hero: { borderWidth: 0, borderColor: '#e5e7eb', radius: 0, shadow: 'none' },
  buttons: { radius: 8, fontWeight: 700, hoverScale: 1.03, transitionMs: 200, bgColor: '#f97316', hoverBgColor: '#ea580c', textColor: '#ffffff' },
  animations: { enabled: true, hoverLift: 2, clickScale: 0.98 },
};

const INPUT_CLASS = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors';
const LABEL_CLASS = 'block text-xs font-bold text-gray-400 mb-1.5';

function Field({ label, value, onChange, type = 'text', placeholder = '', className = '' }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) {
  return <div className={className}><label className={LABEL_CLASS}>{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={type === 'number' ? INPUT_CLASS + ' appearance-none' : INPUT_CLASS} /></div>;
}

function TextArea({ label, value, onChange, rows = 3, dir }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; dir?: 'rtl';
}) {
  return <div><label className={LABEL_CLASS}>{label}</label><textarea dir={dir} value={value} onChange={e => onChange(e.target.value)} rows={rows} className={INPUT_CLASS + ' resize-y' + (dir === 'rtl' ? ' font-urdu text-base' : '')} /></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className={LABEL_CLASS}>{label}</label><div className="flex gap-2"><input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-10 w-12 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer" /><input value={value} onChange={e => onChange(e.target.value)} className={INPUT_CLASS} /></div></div>;
}

export function DevPanel() {
  const { settings, loading, updateSettings } = useSiteSettings();
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [form, setForm] = useState(settings);
  const [activeSection, setActiveSection] = useState<Section>('logo');
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<SiteSettings>>({});

  useEffect(() => {
    if (Object.keys(pendingRef.current).length === 0) setForm(settings);
  }, [settings]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const queueAutoSave = (payload: Partial<SiteSettings>) => {
    pendingRef.current = { ...pendingRef.current, ...payload };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(async () => {
      const changes = pendingRef.current;
      pendingRef.current = {};
      if (!Object.keys(changes).length) return;
      const error = await updateSettings(changes);
      if (error) {
        pendingRef.current = { ...changes, ...pendingRef.current };
        setSaveStatus('error');
        return;
      }
      setSaveStatus('saved');
      showToast('Changes saved successfully', 'success');
    }, 700);
  };

  const update = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    queueAutoSave({ [field]: value } as Partial<SiteSettings>);
  };

  const updateNumber = <K extends keyof SiteSettings>(field: K, value: string) => {
    const num = value === '' ? 0 : Number(value);
    update(field, (Number.isNaN(num) ? 0 : num) as SiteSettings[K]);
  };

  const updateDesign = <K extends keyof DesignSettings>(section: K, patch: Partial<DesignSettings[K]>) => {
    setForm(prev => {
      const nextDesign = {
        ...prev.design_settings,
        [section]: { ...prev.design_settings[section], ...patch },
      };
      queueAutoSave({ design_settings: nextDesign });
      return { ...prev, design_settings: nextDesign };
    });
  };
  
  const resetDesignSection = (section: 'header' | 'hero') => {
    setForm(prev => {
      const nextDesign = { ...prev.design_settings, [section]: { ...ORIGINAL_DESIGN_SETTINGS[section] } };
      queueAutoSave({ design_settings: nextDesign });
      return { ...prev, design_settings: nextDesign };
    });
  };

  const resetButtonsDesign = () => {
    setForm(prev => {
      const nextDesign = { ...prev.design_settings, buttons: { ...ORIGINAL_DESIGN_SETTINGS.buttons }, animations: { ...ORIGINAL_DESIGN_SETTINGS.animations } };
      queueAutoSave({ design_settings: nextDesign });
      return { ...prev, design_settings: nextDesign };
    });
  };

  const uploadTo = async (file: File, folder: string): Promise<string | null> => {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return null;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    const url = await uploadTo(file, 'branding');
    if (url) update('logo_url', url);
    setUploadingLogo(false);
  };

  const handleHeroUpload = async (file: File) => {
    setUploadingHero(true);
    const url = await uploadTo(file, 'branding');
    if (url) update('hero_image_url', url);
    setUploadingHero(false);
  };

  const handleSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const changes = { ...pendingRef.current, ...form };
    pendingRef.current = {};
    setSaving(true);
    const error = await updateSettings(changes);
    setSaving(false);
    setSaveStatus(error ? 'error' : 'saved');
    if (!error) showToast('Changes saved successfully', 'success');
  };

  const handleLogout = async () => {
    await devLogout();
    navigate('home');
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 size={28} className="text-purple-400 animate-spin" /></div>;
  }

  const cardCls = 'bg-gray-950 rounded-2xl border border-gray-800 p-5 sm:p-6 space-y-5';

  const renderSection = () => {
    if (activeSection === 'logo') return (
      <div className={cardCls}>
        <SectionTitle title="Logo" text="Control the store logo used across the site." />
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-40 h-20 rounded-xl border border-gray-800 bg-gray-900 flex items-center justify-center overflow-hidden">
            {form.logo_url ? <img src={form.logo_url} alt="Logo preview" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-gray-600">Default ABR logo</span>}
          </div>
          <label className="flex items-center gap-2 text-sm border-2 border-dashed border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:border-purple-500 transition-colors text-gray-300">
            {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
          </label>
        </div>
        {form.logo_url && <button onClick={() => update('logo_url', '')} className="text-xs text-gray-500 hover:text-red-400">Remove custom logo</button>}
        <div>
          <label className={LABEL_CLASS}>Logo Size</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LOGO_SIZE_OPTIONS.map(opt => <button key={opt.value} onClick={() => update('logo_size', opt.value)} className={`py-2.5 rounded-lg border text-sm font-semibold transition-all active:scale-95 ${form.logo_size === opt.value ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-purple-500'}`}>{opt.label}</button>)}
          </div>
        </div>
      </div>
    );

    if (activeSection === 'header') {
      const d = form.design_settings.header;
      return <div className={cardCls}>
        <SectionTitle title="Header / Navbar" text="Edit the visual properties of the main header without changing its content." action={<button type="button" onClick={() => resetDesignSection('header')} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-xs font-bold text-gray-300 hover:border-purple-500 hover:text-white transition-colors">Original</button>} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Header height (px)" value={d.height} type="number" onChange={v => updateDesign('header', { height: Number(v) || 0 })} />
          <Field label="Text size (px)" value={d.fontSize} type="number" onChange={v => updateDesign('header', { fontSize: Number(v) || 0 })} />
          <Field label="Font weight (400–900)" value={d.fontWeight} type="number" onChange={v => updateDesign('header', { fontWeight: Number(v) || 400 })} />
          <Field label="Border width (px)" value={d.borderWidth} type="number" onChange={v => updateDesign('header', { borderWidth: Number(v) || 0 })} />
          <ColorField label="Header background" value={d.bgColor} onChange={v => updateDesign('header', { bgColor: v })} />
          <ColorField label="Header text" value={d.textColor} onChange={v => updateDesign('header', { textColor: v })} />
          <ColorField label="Hover / active color" value={d.hoverColor} onChange={v => updateDesign('header', { hoverColor: v })} />
          <ColorField label="Border color" value={d.borderColor} onChange={v => updateDesign('header', { borderColor: v })} />
        </div>
        <p className="text-xs text-gray-500">Changes are saved automatically and synced live to the store.</p>
      </div>;
    }

    if (activeSection === 'hero') {
      const d = form.design_settings.hero;
      return <div className={cardCls}>
        <SectionTitle title="Hero" text="Manage the banner image and its presentation. Existing hero text fields are preserved below." action={<button type="button" onClick={() => resetDesignSection('hero')} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-xs font-bold text-gray-300 hover:border-purple-500 hover:text-white transition-colors">Original</button>} />
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <img src={form.hero_image_url} alt="Hero preview" className="w-full sm:w-56 h-32 object-cover rounded-xl border border-gray-800" />
          <label className="flex items-center gap-2 text-sm border-2 border-dashed border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:border-purple-500 text-gray-300">
            {uploadingHero ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploadingHero ? 'Uploading...' : 'Upload New Hero Image'}
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleHeroUpload(e.target.files[0])} />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Border width (px)" value={d.borderWidth} type="number" onChange={v => updateDesign('hero', { borderWidth: Number(v) || 0 })} />
          <Field label="Corner radius (px)" value={d.radius} type="number" onChange={v => updateDesign('hero', { radius: Number(v) || 0 })} />
          <ColorField label="Border color" value={d.borderColor} onChange={v => updateDesign('hero', { borderColor: v })} />
          <div><label className={LABEL_CLASS}>Shadow</label><select value={d.shadow} onChange={e => updateDesign('hero', { shadow: e.target.value })} className={INPUT_CLASS}><option value="none">None</option><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow" value={form.hero_eyebrow} onChange={v => update('hero_eyebrow', v)} />
          <Field label="Main heading" value={form.hero_title} onChange={v => update('hero_title', v)} />
          <Field label="Orange accent word" value={form.hero_title_accent} onChange={v => update('hero_title_accent', v)} />
          <Field label="Discount badge text" value={form.hero_badge_text} onChange={v => update('hero_badge_text', v)} />
        </div>
        <TextArea label="Subtitle line 1" value={form.hero_subtitle_1} onChange={v => update('hero_subtitle_1', v)} />
        <TextArea label="Subtitle line 2" value={form.hero_subtitle_2} onChange={v => update('hero_subtitle_2', v)} />
        <div><label className={LABEL_CLASS}>Trust checklist</label><div className="grid sm:grid-cols-3 gap-3"><input value={form.trust_item_1} onChange={e => update('trust_item_1', e.target.value)} className={INPUT_CLASS} /><input value={form.trust_item_2} onChange={e => update('trust_item_2', e.target.value)} className={INPUT_CLASS} /><input value={form.trust_item_3} onChange={e => update('trust_item_3', e.target.value)} className={INPUT_CLASS} /></div></div>
      </div>;
    }

    if (activeSection === 'buttons') {
      const b = form.design_settings.buttons, a = form.design_settings.animations;
      return <div className={cardCls}>
        <SectionTitle title="Buttons & Animations" text="One central design system for buttons, hover states and click feedback." action={<button type="button" onClick={resetButtonsDesign} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-xs font-bold text-gray-300 hover:border-purple-500 hover:text-white transition-colors">Original</button>} />
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorField label="Button background" value={b.bgColor} onChange={v => updateDesign('buttons', { bgColor: v })} />
          <ColorField label="Button hover background" value={b.hoverBgColor} onChange={v => updateDesign('buttons', { hoverBgColor: v })} />
          <ColorField label="Button text color" value={b.textColor} onChange={v => updateDesign('buttons', { textColor: v })} />
          <Field label="Border radius (px)" value={b.radius} type="number" onChange={v => updateDesign('buttons', { radius: Number(v) || 0 })} />
          <Field label="Font weight" value={b.fontWeight} type="number" onChange={v => updateDesign('buttons', { fontWeight: Number(v) || 400 })} />
          <Field label="Hover scale" value={b.hoverScale} type="number" onChange={v => updateDesign('buttons', { hoverScale: Number(v) || 1 })} />
          <Field label="Transition (ms)" value={b.transitionMs} type="number" onChange={v => updateDesign('buttons', { transitionMs: Number(v) || 0 })} />
        </div>
        <div className="border-t border-gray-800 pt-5 space-y-4">
          <h4 className="text-sm font-bold text-white">Interaction animation</h4>
          <label className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-3 cursor-pointer"><span className="text-sm text-gray-300">Enable subtle animations</span><input type="checkbox" checked={a.enabled} onChange={e => updateDesign('animations', { enabled: e.target.checked })} className="w-5 h-5 accent-purple-600" /></label>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Hover lift (px)" value={a.hoverLift} type="number" onChange={v => updateDesign('animations', { hoverLift: Number(v) || 0 })} />
            <Field label="Click scale" value={a.clickScale} type="number" onChange={v => updateDesign('animations', { clickScale: Number(v) || 1 })} />
          </div>
        </div>
      </div>;
    }

    if (activeSection === 'checkout') return (
      <div className={cardCls}>
        <SectionTitle title="Checkout / Payment" text="All existing COD, advance-payment and payment-channel controls remain here." />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Standard shipping fee (Rs.)" value={form.shipping_fee} type="number" onChange={v => updateNumber('shipping_fee', v)} />
          <Field label="Advance below threshold (Rs.)" value={form.advance_flat_amount} type="number" onChange={v => updateNumber('advance_flat_amount', v)} />
          <Field label="Threshold (Rs.)" value={form.advance_threshold} type="number" onChange={v => updateNumber('advance_threshold', v)} />
          <Field label="Advance above threshold (%)" value={form.advance_percent} type="number" onChange={v => updateNumber('advance_percent', v)} />
          <Field label="Delivery charge above threshold (Rs.)" value={form.delivery_charge_above_threshold} type="number" onChange={v => updateNumber('delivery_charge_above_threshold', v)} />
          <Field label="Full advance discount (%)" value={form.full_advance_discount_percent} type="number" onChange={v => updateNumber('full_advance_discount_percent', v)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => update('cod_language', 'ur')} className={`py-2.5 rounded-lg border font-bold ${form.cod_language === 'ur' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>Urdu</button>
          <button onClick={() => update('cod_language', 'en')} className={`py-2.5 rounded-lg border font-bold ${form.cod_language === 'en' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-900 border-gray-700 text-gray-400'}`}>English</button>
        </div>
        <TextArea label="COD policy — Urdu" value={form.cod_policy_urdu} onChange={v => update('cod_policy_urdu', v)} rows={4} dir="rtl" />
        <TextArea label="COD policy — English" value={form.cod_policy_english} onChange={v => update('cod_policy_english', v)} rows={4} />
        <TextArea label="Why Advance Payment? — Urdu" value={form.why_advance_note_urdu} onChange={v => update('why_advance_note_urdu', v)} rows={4} dir="rtl" />
        <TextArea label="Why Advance Payment? — English" value={form.why_advance_note} onChange={v => update('why_advance_note', v)} rows={4} />
        <div className="border-t border-gray-800 pt-5 space-y-4">
          <h4 className="text-sm font-bold text-purple-400">JazzCash</h4>
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Account title" value={form.wallet_name} onChange={v => update('wallet_name', v)} /><Field label="JazzCash number" value={form.wallet_number} onChange={v => update('wallet_number', v)} /></div>
          <h4 className="text-sm font-bold text-purple-400">NayaPay</h4>
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Account title" value={form.bank_title} onChange={v => update('bank_title', v)} /><Field label="NayaPay account number" value={form.bank_account_number} onChange={v => update('bank_account_number', v)} /></div>
          <h4 className="text-sm font-bold text-purple-400">Bank</h4>
          <div className="grid sm:grid-cols-2 gap-4"><Field label="Account title" value={form.bank2_title} onChange={v => update('bank2_title', v)} /><Field label="Bank name" value={form.bank2_name} onChange={v => update('bank2_name', v)} /><Field label="Account number / IBAN" value={form.bank2_account_number} onChange={v => update('bank2_account_number', v)} className="sm:col-span-2" /></div>
          <Field label="Support hours" value={form.payment_support_hours} onChange={v => update('payment_support_hours', v)} />
          <Field label="Payment screenshot note" value={form.payment_screenshot_note} onChange={v => update('payment_screenshot_note', v)} />
        </div>
      </div>
    );

    if (activeSection === 'footer') return (
      <div className={cardCls}>
        <SectionTitle title="Footer" text="Everything previously editable in the footer is preserved here." />
        <div className="grid sm:grid-cols-2 gap-4">
          {(['footer_stat_1_value','footer_stat_1_label','footer_stat_2_value','footer_stat_2_label','footer_stat_3_value','footer_stat_3_label','footer_stat_4_value','footer_stat_4_label'] as const).map(k => <Field key={k} label={k.replace('footer_','').replace(/_/g,' ')} value={form[k]} onChange={v => update(k, v)} />)}
        </div>
        <TextArea label="Footer description" value={form.footer_description} onChange={v => update('footer_description', v)} />
        <Field label="Footer email" value={form.footer_email} onChange={v => update('footer_email', v)} />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Quick links title" value={form.footer_quick_title} onChange={v => update('footer_quick_title', v)} />
          <Field label="Categories title" value={form.footer_categories_title} onChange={v => update('footer_categories_title', v)} />
          <Field label="Contact title" value={form.footer_contact_title} onChange={v => update('footer_contact_title', v)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['footer_quick_home','footer_quick_shop','footer_quick_new_arrivals','footer_quick_best_sellers','footer_quick_contact','footer_quick_about','footer_quick_return','footer_quick_privacy'] as const).map(k => <Field key={k} label={k.replace('footer_quick_','').replace(/_/g,' ')} value={form[k]} onChange={v => update(k, v)} />)}
        </div>
        <TextArea label="Footer categories — separate with |" value={form.footer_categories} onChange={v => update('footer_categories', v)} rows={2} />
        <Field label="Copyright text" value={form.footer_copyright} onChange={v => update('footer_copyright', v)} />
      </div>
    );

    if (activeSection === 'security') return <div className="space-y-5"><AccountSecurity role="developer" /><AccountManagement /></div>;

    if (activeSection === 'contact') return (
      <div className={cardCls}>
        <SectionTitle title="Contact / Announcement" text="Store contact details and the top scrolling announcement bar." />
        <Field label="Official WhatsApp number" value={form.whatsapp_number} onChange={v => update('whatsapp_number', v)} />
        <Field label="Store address" value={form.store_address} onChange={v => update('store_address', v)} />
        <TextArea label="Top scrolling messages — separate with |" value={form.announcement_messages} onChange={v => update('announcement_messages', v)} rows={3} />
      </div>
    );

    return (
      <div className={cardCls}>
        <SectionTitle title="Social Media" text="Leave a URL blank to hide that social icon from the footer." />
        <Field label="Facebook URL" value={form.facebook_url || ''} onChange={v => update('facebook_url', v || null)} placeholder="https://facebook.com/yourpage" />
        <Field label="Instagram URL" value={form.instagram_url || ''} onChange={v => update('instagram_url', v || null)} placeholder="https://instagram.com/yourpage" />
        <Field label="TikTok URL" value={form.tiktok_url || ''} onChange={v => update('tiktok_url', v || null)} placeholder="https://tiktok.com/@yourpage" />
        <Field label="YouTube URL" value={form.youtube_url || ''} onChange={v => update('youtube_url', v || null)} placeholder="https://youtube.com/@yourpage" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck size={21} className="text-purple-400 flex-shrink-0" />
            <div className="min-w-0"><h1 className="font-black text-white text-sm">Developer Studio</h1><p className="text-xs text-gray-500 truncate">Private website editor — changes auto-save live</p></div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => window.open('/', '_blank')} className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white active:scale-95 transition-all"><ExternalLink size={14} /> View Store</button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-400 active:scale-95 transition-all"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
        <div className="lg:hidden mb-4">
          <button onClick={() => setSectionMenuOpen(v => !v)} className="w-full flex items-center justify-between gap-3 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-left">
            <span className="flex items-center gap-3 min-w-0">
              <Menu size={18} className="text-purple-400 flex-shrink-0" />
              <span className="min-w-0"><span className="block text-sm font-bold text-white">{SECTIONS.find(s => s.id === activeSection)?.label}</span><span className="block text-[11px] text-gray-500 truncate">Website Editor section</span></span>
            </span>
            {sectionMenuOpen ? <X size={20} className="text-gray-400" /> : <Menu size={20} className="text-gray-400" />}
          </button>
          {sectionMenuOpen && (
            <div className="mt-2 bg-gray-950 border border-gray-800 rounded-xl p-2 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {SECTIONS.map(s => {
                  const Icon = s.icon;
                  const active = activeSection === s.id;
                  return <button key={s.id} onClick={() => { setActiveSection(s.id); setSectionMenuOpen(false); }} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all ${active ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-900 hover:text-white"}`}><Icon size={17} className="flex-shrink-0" /><span className="text-sm font-semibold">{s.label}</span></button>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start">
          <aside className="hidden lg:block lg:sticky lg:top-24 bg-gray-950 border border-gray-800 rounded-2xl p-2">
            <div className="px-3 py-3 border-b border-gray-800 mb-2"><p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Website Editor</p><p className="text-xs text-gray-500 mt-1">Select a section</p></div>
            <div className="flex flex-col gap-1">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all active:scale-[0.98] ${active ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:bg-gray-900 hover:text-white"}`}><Icon size={17} /><span className="min-w-0"><span className="block text-sm font-bold whitespace-nowrap">{s.label}</span><span className={`block text-[10px] mt-0.5 ${active ? "text-purple-100" : "text-gray-600"}`}>{s.description}</span></span></button>;
              })}
            </div>
          </aside>

          <main className="min-w-0 w-full space-y-4 pb-24">
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="min-w-0"><h2 className="text-xl sm:text-2xl font-black text-white">{SECTIONS.find(s => s.id === activeSection)?.label}</h2><p className="text-xs text-gray-500 mt-1">Edit details below. Your changes save automatically.</p></div>
              <div className="text-xs font-semibold flex items-center gap-2 flex-shrink-0">
                {saveStatus === "saving" && <><Loader2 size={14} className="animate-spin text-purple-400" /><span className="text-purple-300 hidden sm:inline">Saving…</span></>}
                {saveStatus === "saved" && <><CheckCircle size={14} className="text-green-400" /><span className="text-green-300 hidden sm:inline">Saved</span></>}
                {saveStatus === "error" && <span className="text-red-400">Save failed</span>}
              </div>
            </div>
            {renderSection()}
          </main>
        </div>
      </div>
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 z-50 bg-gray-950/95 backdrop-blur border border-gray-800 rounded-xl px-3 py-2.5 shadow-2xl flex items-center gap-3">
        <span className="text-xs text-gray-400">{saveStatus === 'saving' ? 'Saving automatically…' : saveStatus === 'saved' ? 'Live settings updated ✓' : saveStatus === 'error' ? 'Please try saving again.' : 'Auto-save is on'}</span>
        <button onClick={handleSave} disabled={saving} className="ml-auto text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 active:scale-95 px-3 py-2 rounded-lg transition-all">{saving ? 'Saving…' : 'Save All Now'}</button>
      </div>
    </div>
  );
}

function SectionTitle({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white text-base">{title}</h3><p className="text-xs text-gray-500 mt-1">{text}</p></div>{action}</div>;
}
