import { useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';
import { devLogout } from '../../lib/devAuth';

const LOGO_SIZE_OPTIONS: { value: 'sm' | 'md' | 'lg' | 'xl'; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium (default)' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
];

export function DevPanel() {
  const { settings, loading, updateSettings } = useSiteSettings();
  const { navigate } = useNavigation();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const updateNumber = (field: keyof typeof form, value: string) => {
    const num = value === '' ? 0 : Number(value);
    setForm(prev => ({ ...prev, [field]: Number.isNaN(num) ? 0 : num }));
    setSaved(false);
  };

  const uploadTo = async (file: File, folder: string): Promise<string | null> => {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
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
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    await devLogout();
    navigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500 transition-colors';

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-purple-400" />
            <div>
              <h1 className="font-black text-white text-sm">Developer Studio</h1>
              <p className="text-xs text-gray-500">Site branding &amp; homepage — private, not visible to the store admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open('/', '_blank')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
              <ExternalLink size={14} /> View Store
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* LOGO */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">Logo</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-16 rounded-lg border border-gray-800 bg-gray-900 flex items-center justify-center overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-gray-600">Using default ABR logo</span>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm border-2 border-dashed border-gray-700 rounded-lg px-4 py-2.5 cursor-pointer hover:border-purple-500 transition-colors text-gray-300">
              {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
            </label>
          </div>
          {form.logo_url && (
            <button onClick={() => update('logo_url', '')} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Remove custom logo (use default ABR branding instead)
            </button>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Logo Size (applies everywhere — navbar, footer, hero)</label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => update('logo_size', opt.value)}
                  className={`text-sm font-semibold py-2 rounded-lg border transition-colors ${
                    form.logo_size === opt.value
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">Hero Banner Image</h3>
          <div className="flex items-center gap-4">
            <img src={form.hero_image_url} alt="Hero preview" className="w-32 h-20 object-cover rounded-lg border border-gray-800" />
            <label className="flex items-center gap-2 text-sm border-2 border-dashed border-gray-700 rounded-lg px-4 py-2.5 cursor-pointer hover:border-purple-500 transition-colors text-gray-300">
              {uploadingHero ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingHero ? 'Uploading...' : 'Upload New Image'}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleHeroUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* HERO TEXT */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">Hero Text</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Small text above heading</label>
            <input value={form.hero_eyebrow} onChange={e => update('hero_eyebrow', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Main Heading</label>
            <input value={form.hero_title} onChange={e => update('hero_title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Which word in the heading should be orange? (must match exactly)</label>
            <input value={form.hero_title_accent} onChange={e => update('hero_title_accent', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Subtitle line 1</label>
            <input value={form.hero_subtitle_1} onChange={e => update('hero_subtitle_1', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Subtitle line 2</label>
            <input value={form.hero_subtitle_2} onChange={e => update('hero_subtitle_2', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Discount badge text (e.g. "40%")</label>
            <input value={form.hero_badge_text} onChange={e => update('hero_badge_text', e.target.value)} className={`${inputCls} w-32`} />
          </div>
        </div>

        {/* TRUST CHECKLIST */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">Trust Checklist (3 lines in hero)</h3>
          <input value={form.trust_item_1} onChange={e => update('trust_item_1', e.target.value)} className={inputCls} />
          <input value={form.trust_item_2} onChange={e => update('trust_item_2', e.target.value)} className={inputCls} />
          <input value={form.trust_item_3} onChange={e => update('trust_item_3', e.target.value)} className={inputCls} />
        </div>

        {/* PAYMENT SETTINGS */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Payment &amp; Shipping</h3>
            <p className="text-xs text-gray-500 mt-0.5">Controls the Checkout page's advance-payment options and bank details.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Standard shipping fee (Rs.) — waived for Full Advance Payment</label>
            <input type="number" value={form.shipping_fee} onChange={e => updateNumber('shipping_fee', e.target.value)} className={`${inputCls} w-32`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Advance below threshold (Rs. flat)</label>
              <input type="number" value={form.advance_flat_amount} onChange={e => updateNumber('advance_flat_amount', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Threshold (Rs.)</label>
              <input type="number" value={form.advance_threshold} onChange={e => updateNumber('advance_threshold', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Advance above threshold (%)</label>
              <input type="number" value={form.advance_percent} onChange={e => updateNumber('advance_percent', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Full Advance Payment discount (%)</label>
            <input type="number" value={form.full_advance_discount_percent} onChange={e => updateNumber('full_advance_discount_percent', e.target.value)} className={`${inputCls} w-32`} />
          </div>

          <div className="border-t border-gray-800 pt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Bank Account Title</label>
              <input value={form.bank_title} onChange={e => update('bank_title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Bank Name</label>
              <input value={form.bank_name} onChange={e => update('bank_name', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">Bank Account Number / IBAN</label>
              <input value={form.bank_account_number} onChange={e => update('bank_account_number', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Wallet Name (Easypaisa/JazzCash)</label>
              <input value={form.wallet_name} onChange={e => update('wallet_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Wallet Number</label>
              <input value={form.wallet_number} onChange={e => update('wallet_number', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">Support Hours (shown after payment)</label>
              <input value={form.payment_support_hours} onChange={e => update('payment_support_hours', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* SOCIAL MEDIA LINKS */}
        <div className="bg-gray-950 rounded-xl border border-gray-800 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Social Media Links</h3>
            <p className="text-xs text-gray-500 mt-0.5">Icons only appear in the footer once a link is filled in — leave blank to hide.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Facebook Page URL</label>
            <input value={form.facebook_url || ''} onChange={e => update('facebook_url', e.target.value)} placeholder="https://facebook.com/yourpage" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Instagram URL</label>
            <input value={form.instagram_url || ''} onChange={e => update('instagram_url', e.target.value)} placeholder="https://instagram.com/yourpage" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">TikTok URL</label>
            <input value={form.tiktok_url || ''} onChange={e => update('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@yourpage" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">YouTube URL</label>
            <input value={form.youtube_url || ''} onChange={e => update('youtube_url', e.target.value)} placeholder="https://youtube.com/@yourpage" className={inputCls} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : null}
          {saving ? 'Saving...' : saved ? 'Saved! Live now.' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
