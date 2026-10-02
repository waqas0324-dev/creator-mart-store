import { useState, useRef, type ReactNode } from 'react';
import { Loader2, Banknote, Wallet, Smartphone, Landmark, Sparkles, Copy, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { supabase } from '../lib/supabase';
import { onImageError, resolveProductImage } from '../lib/imageFallback';

const PROVINCES = ['Azad Kashmir', 'Balochistan', 'FATA', 'Gilgit Baltistan', 'Islamabad Capital Territory', 'Khyber Pakhtunkhwa', 'Punjab', 'Sindh'];

type PayMethod = 'cash_on_delivery' | 'full_advance';

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();

  const [form, setForm] = useState({
    fullName: '', phone: '', whatsapp: '', email: '', address: '', postalCode: '',
    province: '', area: '', paymentMethod: 'cash_on_delivery' as PayMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const isFullAdvance = form.paymentMethod === 'full_advance';
  const isAboveThreshold = subtotal >= settings.advance_threshold;
  const shippingFee = isFullAdvance
    ? 0
    : isAboveThreshold
      ? settings.delivery_charge_above_threshold
      : settings.shipping_fee;
  const discount = isFullAdvance ? Math.round(subtotal * (settings.full_advance_discount_percent / 100)) : 0;
  const total = subtotal + shippingFee - discount;
  const advanceRequired = !isAboveThreshold
    ? shippingFee
    : Math.round(subtotal * (settings.advance_percent / 100)) + shippingFee;
  const amountToPayNow = isFullAdvance ? total : advanceRequired;

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const updatePhone = (value: string) => setForm(prev => ({ ...prev, phone: value }));

  const withTimeout = async <T,>(promise: PromiseLike<T>, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), 15000);
    });
    try {
      return await Promise.race([Promise.resolve(promise), timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/\D/g, '');
    const whatsappDigits = form.whatsapp.replace(/\D/g, '');

    if (!form.fullName.trim()) e.fullName = 'Please enter your full name.';
    else if (form.fullName.trim().length < 2) e.fullName = 'Please enter a valid full name.';
    if (!form.phone.trim()) e.phone = 'Please enter your phone number.';
    else if (phoneDigits.length < 10 || phoneDigits.length > 15) e.phone = 'Please enter a valid phone number.';
    if (!form.whatsapp.trim()) e.whatsapp = 'Please enter your WhatsApp number.';
    else if (whatsappDigits.length < 10 || whatsappDigits.length > 15) e.whatsapp = 'Please enter a valid WhatsApp number.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!form.address.trim()) e.address = 'Please enter your complete delivery address.';
    else if (form.address.trim().length < 8) e.address = 'Please enter a more complete delivery address.';
    if (!form.province) e.province = 'Please select your province.';

    setErrors(e);

    const firstError = Object.keys(e)[0];
    if (firstError) {
      requestAnimationFrame(() => {
        const field = fieldRefs.current[firstError];
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus();
      });
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setSubmitError('Please fix the highlighted fields before placing your order.');
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const orderId = crypto.randomUUID();

      const { data: order, error } = await withTimeout(
        supabase.from('orders').insert({
      id: orderId,
      customer_name: form.fullName,
      customer_phone: form.phone,
      customer_whatsapp: form.whatsapp,
      customer_email: form.email || null,
      customer_address: [form.address, form.postalCode ? `Postal Code: ${form.postalCode}` : '', form.province].filter(Boolean).join(', '),
      customer_city: null,
      customer_area: form.area || null,
      payment_method: form.paymentMethod,
      subtotal, shipping: shippingFee, total,
      advance_amount: amountToPayNow,
      advance_payment_status: 'pending',
      advance_payment_received_at: null,
      status: 'new',
      payment_proof_path: null,
      payment_proof_status: 'not_required',
        payment_proof_uploaded_at: null,
      }).select().single(),
        'Order submission timed out. Please check your internet connection and try again.'
      );

      if (error || !order) {
        setLoading(false);
        setSubmitError(error?.message || 'The order could not be created. Please try again.');
        return;
      }

      const { error: itemsError } = await withTimeout(
        supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        }))),
        'Order items could not be saved because the request timed out. Please try again or contact support.'
      );

      if (itemsError) {
        setLoading(false);
        setSubmitError(itemsError.message || 'The order was created, but its items could not be saved. Please contact support before submitting again.');
        return;
      }

      clearCart();
      setLoading(false);
      navigate('order-success', { orderId: order.id });
    } catch (submitException) {
      setLoading(false);
      setSubmitError(submitException instanceof Error ? submitException.message : 'Something went wrong while placing your order. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg font-semibold">Your cart is empty.</p>
        <button onClick={() => navigate('shop')} data-design-button="true" className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold btn-interactive">Continue Shopping</button>
      </div>
    );
  }

  const inputCls = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${errors[field] ? 'border-red-400' : 'border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-100'}`;

  const CopyRow = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-bold text-gray-900 text-base whitespace-nowrap">{value}</span>
        <button type="button" onClick={() => copyToClipboard(value, copyKey)} className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
          {copied === copyKey ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );

  const ChannelCard = ({ icon, name, rows, theme }: { icon: ReactNode; name: string; rows: { label: string; value: string; copyKey: string }[]; theme: 'cod' | 'advance' }) => (
    <div className="bg-white border-2 rounded-xl overflow-hidden shadow-sm" style={{ borderColor: theme === 'cod' ? '#0d9488' : '#d97706' }}>
      <p className={`flex items-center gap-2 text-sm font-black uppercase tracking-wide px-4 py-2 text-white ${theme === 'cod' ? 'bg-teal-600' : 'bg-amber-600'}`}>
        {icon} {name}
      </p>
      <div className="space-y-2 px-4 py-3">
        {rows.map(r => <CopyRow key={r.copyKey} label={r.label} value={r.value} copyKey={r.copyKey} />)}
      </div>
    </div>
  );

  const PaymentNote = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
      📸 Payment screenshot required after payment. Please send your screenshot on WhatsApp at <strong>{settings.whatsapp_number}</strong>.
      Support available: <strong>{settings.payment_support_hours}</strong>.
      <div className="mt-2 font-semibold text-yellow-900">
        After receiving the screenshot, our admin will verify the advance payment and update your order status to Confirmed.
      </div>
    </div>
  );

  /* Cash on Delivery — only the 2 mobile-wallet channels (JazzCash, NayaPay),
     cool teal theme so it visually reads as "quick advance", separate from
     the premium gold look used for Full Advance below. */
  const CODPaymentBox = () => (
    <div className="mt-2 bg-teal-50 border-2 border-teal-500 rounded-xl p-4 space-y-4">
      <div className="bg-teal-600 text-white rounded-lg px-4 py-2.5 text-center font-black text-lg shadow">
        Advance to Pay Now: Rs. {amountToPayNow.toLocaleString()}
      </div>
      <div className="space-y-3">
        <ChannelCard theme="cod" icon={<Smartphone size={14} />} name="JazzCash" rows={[
          { label: 'Number', value: settings.wallet_number, copyKey: 'cod-jazzcash-num' },
          { label: 'Title', value: settings.wallet_name, copyKey: 'cod-jazzcash-title' },
        ]} />
        <ChannelCard theme="cod" icon={<Wallet size={14} />} name="NayaPay" rows={[
          { label: 'Account', value: settings.bank_account_number, copyKey: 'cod-nayapay-num' },
          { label: 'Title', value: settings.bank_title, copyKey: 'cod-nayapay-title' },
        ]} />
      </div>
      <PaymentNote />
    </div>
  );

  /* Full Advance Payment — all 3 channels including the bank, warm gold/amber
     "premium" theme to match the Free Delivery + Discount incentive. */
  const FullAdvancePaymentBox = () => (
    <div className="mt-2 bg-amber-50 border-2 border-amber-500 rounded-xl p-4 space-y-4">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg px-4 py-2.5 text-center font-black text-lg shadow">
        Full Amount to Pay Now: Rs. {amountToPayNow.toLocaleString()}
      </div>
      <div className="space-y-3">
        <ChannelCard theme="advance" icon={<Smartphone size={14} />} name="JazzCash" rows={[
          { label: 'Number', value: settings.wallet_number, copyKey: 'fa-jazzcash-num' },
          { label: 'Title', value: settings.wallet_name, copyKey: 'fa-jazzcash-title' },
        ]} />
        <ChannelCard theme="advance" icon={<Wallet size={14} />} name="NayaPay" rows={[
          { label: 'Account', value: settings.bank_account_number, copyKey: 'fa-nayapay-num' },
          { label: 'Title', value: settings.bank_title, copyKey: 'fa-nayapay-title' },
        ]} />
        <ChannelCard theme="advance" icon={<Landmark size={14} />} name={settings.bank2_name} rows={[
          { label: 'Account', value: settings.bank2_account_number, copyKey: 'fa-bank-num' },
          { label: 'Title', value: settings.bank2_title, copyKey: 'fa-bank-title' },
        ]} />
      </div>
      <PaymentNote />
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Checkout</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-black text-gray-900 uppercase mb-6">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide mb-5">Billing Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input ref={el => { fieldRefs.current.fullName = el; }} id="checkout-full-name" type="text" autoComplete="name" placeholder="Enter your full name" value={form.fullName} onChange={e => update('fullName', e.target.value)} className={inputCls('fullName')} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'error-fullName' : undefined} />
                    {errors.fullName && <p id="error-fullName" className="text-red-500 text-xs mt-1" role="alert">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input ref={el => { fieldRefs.current.phone = el; }} id="checkout-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03xx xxx xxxx" value={form.phone} onChange={e => updatePhone(e.target.value)} className={inputCls('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'error-phone' : undefined} />
                    {errors.phone && <p id="error-phone" className="text-red-500 text-xs mt-1" role="alert">{errors.phone}</p>}
                  </div>
                  <div>
                    <div className="mb-1">
                      <label className="block text-xs font-semibold text-gray-700">WhatsApp Number <span className="text-red-500">*</span></label>
                    </div>
                    <input ref={el => { fieldRefs.current.whatsapp = el; }} id="checkout-whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="03xx xxx xxxx" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} className={inputCls('whatsapp')} aria-invalid={!!errors.whatsapp} aria-describedby={errors.whatsapp ? 'error-whatsapp' : undefined} />
                    {errors.whatsapp && <p id="error-whatsapp" className="text-red-500 text-xs mt-1" role="alert">{errors.whatsapp}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <input ref={el => { fieldRefs.current.email = el; }} id="checkout-email" type="email" inputMode="email" autoComplete="email" placeholder="Enter your email (optional)" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'error-email' : undefined} />
                    {errors.email && <p id="error-email" className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input ref={el => { fieldRefs.current.address = el; }} id="checkout-address" type="text" autoComplete="street-address" placeholder="House no., Street, Area, City" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls('address')} aria-invalid={!!errors.address} aria-describedby={errors.address ? 'error-address' : undefined} />
                    {errors.address && <p id="error-address" className="text-red-500 text-xs mt-1" role="alert">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
                    <input type="text" autoComplete="postal-code" placeholder="Postal / Post Office Code" value={form.postalCode} onChange={e => update('postalCode', e.target.value)} className={inputCls('postalCode')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Province <span className="text-red-500">*</span></label>
                    <select ref={el => { fieldRefs.current.province = el; }} id="checkout-province" autoComplete="address-level1" value={form.province} onChange={e => update('province', e.target.value)} className={inputCls('province')} aria-invalid={!!errors.province} aria-describedby={errors.province ? 'error-province' : undefined}>
                      <option value="">Select your province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <p id="error-province" className="text-red-500 text-xs mt-1" role="alert">{errors.province}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Area</label>
                    <input type="text" placeholder="Area / Sector" value={form.area} onChange={e => update('area', e.target.value)} className={inputCls('area')} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wide mb-4">Payment Method</h4>
                <div className="space-y-3">
                  <div>
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.paymentMethod === 'cash_on_delivery' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                      onClick={() => update('paymentMethod', 'cash_on_delivery')}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.paymentMethod === 'cash_on_delivery' ? 'border-orange-500' : 'border-gray-300'}`}>
                        {form.paymentMethod === 'cash_on_delivery' && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote size={18} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">Cash on Delivery</span>
                      </div>
                    </label>
                    {form.paymentMethod === 'cash_on_delivery' && (
                      <>
                        <div className="mt-2 bg-teal-50 border-2 border-teal-600 rounded-xl p-4 text-sm text-gray-900">
                          <p className="font-urdu cod-policy-glow text-teal-800 mb-1 text-base">
                            {settings.cod_language === 'en' ? settings.cod_policy_english : settings.cod_policy_urdu}
                          </p>
                          <table className="w-full mt-4 text-xs table-fixed">
                            <thead><tr className="border-b border-teal-300 text-left"><th className="w-[52%] py-2 pr-4">Order Total</th><th className="w-[48%] py-2 pl-4">Advance Required</th></tr></thead>
                            <tbody>
                              <tr><td className="py-2 pr-4 font-semibold">Under Rs. {settings.advance_threshold.toLocaleString()}</td><td className="py-2 pl-4 font-semibold">Rs. {settings.advance_flat_amount} flat</td></tr>
                              <tr><td className="py-2 pr-4 font-semibold">Rs. {settings.advance_threshold.toLocaleString()} and above</td><td className="py-2 pl-4 font-semibold">{settings.advance_percent}% + delivery</td></tr>
                            </tbody>
                          </table>
                          <p className="mt-2 text-xs text-gray-600">Support: {settings.payment_support_hours}</p>
                          <div className="mt-3 pt-3 border-t border-teal-300">
                            <p className="font-bold text-teal-800 text-xs mb-1">Why Advance Payment?</p>
                            <p className={settings.cod_language === 'ur' ? 'font-urdu text-xs text-gray-700 leading-relaxed' : 'text-xs text-gray-700 leading-relaxed'}>
                              {settings.cod_language === 'ur' ? settings.why_advance_note_urdu : settings.why_advance_note}
                            </p>
                          </div>
                        </div>
                        <CODPaymentBox />
                      </>
                    )}
                  </div>

                  <div>
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.paymentMethod === 'full_advance' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                      onClick={() => update('paymentMethod', 'full_advance')}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.paymentMethod === 'full_advance' ? 'border-orange-500' : 'border-gray-300'}`}>
                        {form.paymentMethod === 'full_advance' && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">Full Advance Payment</span>
                        <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Free Delivery + {settings.full_advance_discount_percent}% Off</span>
                      </div>
                    </label>
                    {form.paymentMethod === 'full_advance' && <FullAdvancePaymentBox />}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
                <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide mb-5">Your Order</h3>
                <div className="grid grid-cols-2 text-xs font-bold uppercase text-gray-500 border-b border-gray-100 pb-2 mb-3">
                  <span>Product</span><span className="text-right">Subtotal</span>
                </div>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.product.id} className="flex gap-3">
                      <img src={resolveProductImage(item.product.image_url)} alt={item.product.name} referrerPolicy="no-referrer" onError={(e) => onImageError(e, item.product.name)} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 flex justify-between items-start gap-2 text-sm">
                        <span className="text-gray-700 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.product.name}
                          {item.quantity > 1 && <span className="text-gray-400 ml-1">×{item.quantity}</span>}
                        </span>
                        <span className="font-semibold flex-shrink-0">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-3 border-t border-gray-100 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {isFullAdvance ? 'Shipping' : 'Delivery Charges'}
                      {!isFullAdvance && (
                        <span className="ml-1.5 inline-block bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle">ADVANCE REQUIRED</span>
                      )}
                    </span>
                    <span className={`font-semibold ${shippingFee === 0 ? 'text-green-600' : ''}`}>{shippingFee === 0 ? 'Free' : `Rs. ${shippingFee.toLocaleString()}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Advance Payment Discount ({settings.full_advance_discount_percent}%)</span><span className="font-semibold">-Rs. {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-base">
                    <span>Total</span><span className="text-orange-500">Rs. {total.toLocaleString()}</span>
                  </div>
                  {amountToPayNow > 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                      <span className="text-gray-600">Pay Now</span><span className="font-bold text-orange-600">Rs. {amountToPayNow.toLocaleString()}</span>
                    </div>
                  )}
                  {!isFullAdvance ? (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Remaining Price</span><span>Rs. {Math.max(0, total - amountToPayNow).toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                {submitError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2.5">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-design-button="true" className="w-full mt-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 btn-interactive"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
