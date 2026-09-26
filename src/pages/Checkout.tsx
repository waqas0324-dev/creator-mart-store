import { useState, type ReactNode } from 'react';
import { Loader2, Banknote, Wallet, Smartphone, Landmark, Sparkles, Copy, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { supabase } from '../lib/supabase';
import { onImageError, resolveProductImage } from '../lib/imageFallback';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

type PayMethod = 'cash_on_delivery' | 'full_advance';

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { navigate } = useNavigation();
  const { settings } = useSiteSettings();

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', address: '',
    city: '', area: '', paymentMethod: 'cash_on_delivery' as PayMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [submitError, setSubmitError] = useState('');

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
    ? settings.advance_flat_amount
    : Math.round(subtotal * (settings.advance_percent / 100));
  const amountToPayNow = isFullAdvance ? total : advanceRequired;

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city) e.city = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');

    const orderNumber = `#ABR${Date.now().toString().slice(-6)}`;
    const { data: order, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_name: form.fullName,
      customer_phone: form.phone,
      customer_email: form.email || null,
      customer_address: form.address,
      customer_city: form.city,
      customer_area: form.area || null,
      payment_method: form.paymentMethod,
      subtotal, shipping: shippingFee, total,
      advance_amount: amountToPayNow,
      status: 'new',
    }).select().single();

    if (error || !order) {
      setLoading(false);
      setSubmitError('Something went wrong while placing your order. Please try again, or send your order details directly via WhatsApp.');
      return;
    }

    await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }))
    );

    clearCart();
    setLoading(false);
    navigate('order-success', { orderId: order.id });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg font-semibold">Your cart is empty.</p>
        <button onClick={() => navigate('shop')} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold">Continue Shopping</button>
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
      📸 {settings.payment_screenshot_note} <strong>{settings.whatsapp_number}</strong>.
      Support available: <strong>{settings.payment_support_hours}</strong>.
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
                    <input type="text" placeholder="Enter your full name" value={form.fullName} onChange={e => update('fullName', e.target.value)} className={inputCls('fullName')} />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input type="tel" placeholder="03xx xxx xxxx" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls('phone')} />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <input type="email" placeholder="Enter your email (optional)" value={form.email} onChange={e => update('email', e.target.value)} className={inputCls('email')} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="House no., Street, Area" value={form.address} onChange={e => update('address', e.target.value)} className={inputCls('address')} />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select City <span className="text-red-500">*</span></label>
                      <select value={form.city} onChange={e => update('city', e.target.value)} className={inputCls('city')}>
                        <option value="">Select your city</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Select Area</label>
                      <input type="text" placeholder="Area / Sector" value={form.area} onChange={e => update('area', e.target.value)} className={inputCls('area')} />
                    </div>
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
                          <p className="font-urdu text-teal-800 mb-1 text-base">{settings.cod_policy_urdu}</p>
                          <table className="w-full mt-3 text-xs">
                            <thead><tr className="border-b border-teal-300 text-left"><th className="py-1">Order Total</th><th className="py-1">Advance Required</th></tr></thead>
                            <tbody>
                              <tr><td className="py-1 font-semibold">Under Rs. {settings.advance_threshold.toLocaleString()}</td><td className="py-1 font-semibold">Rs. {settings.advance_flat_amount} flat</td></tr>
                              <tr><td className="py-1 font-semibold">Rs. {settings.advance_threshold.toLocaleString()} and above</td><td className="py-1 font-semibold">{settings.advance_percent}% of order total + Rs. {settings.delivery_charge_above_threshold} delivery</td></tr>
                            </tbody>
                          </table>
                          <p className="mt-2 text-xs text-gray-600">Support: {settings.payment_support_hours}</p>
                          <div className="mt-3 pt-3 border-t border-teal-300">
                            <p className="font-bold text-teal-800 text-xs mb-1">Why Advance Payment?</p>
                            <p className="text-xs text-gray-700 leading-relaxed">{settings.why_advance_note}</p>
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
                      <span>Remaining (Cash on Delivery)</span><span>Rs. {subtotal.toLocaleString()}</span>
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
                  className="w-full mt-5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
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
