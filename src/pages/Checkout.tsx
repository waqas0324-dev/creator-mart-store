import { useState } from 'react';
import { Loader2, Banknote, CreditCard, Copy, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { supabase } from '../lib/supabase';
import { onImageError, resolveProductImage } from '../lib/imageFallback';
import { WHATSAPP_NUMBER } from '../lib/brand';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

type PayMethod = 'cash_on_delivery' | 'bank_transfer';

const BANK_DETAILS = {
  accountTitle: 'CREATORMART PK',
  iban: 'PK00NAYP0000000000000000',
  bank: 'NAYAPAY',
  jazzCash: WHATSAPP_NUMBER,
  name: 'Muhammad Waqas',
  whatsapp: WHATSAPP_NUMBER,
};

export function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { navigate } = useNavigation();
  const total = subtotal;

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', address: '',
    city: '', area: '', paymentMethod: 'cash_on_delivery' as PayMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

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
      subtotal, shipping: 0, total,
      status: form.paymentMethod === 'bank_transfer' ? 'processing' : 'pending',
    }).select().single();

    if (error || !order) { setLoading(false); return; }

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
            {/* Billing Details */}
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

              {/* Payment Method */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wide mb-4">Payment Method</h4>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
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
                        <span className="text-sm font-bold text-gray-900">Cash on delivery</span>
                      </div>
                    </label>
                    {form.paymentMethod === 'cash_on_delivery' && (
                      <div className="mt-2 space-y-2">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-gray-800 space-y-1.5">
                          <p className="font-bold text-orange-600 text-base">Cash on Delivery — Rs. 500 Advance Required</p>
                          <p>Order confirm karne ke liye <strong>Rs. 500 advance</strong> JazzCash par bhejein.</p>
                          <p>Agar parcel <strong>Rs. 1500+</strong> ka hai aur aap <strong>100% advance</strong> den to delivery charges maaf aur extra discount milegi.</p>
                          <p>Parcels above <strong>Rs. 15,000</strong> — 20% advance mandatory hai.</p>
                        </div>
                        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-sm space-y-2">
                          <p className="font-bold text-green-700 text-sm uppercase tracking-wide">JazzCash Number</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-gray-900 tracking-wider">{WHATSAPP_NUMBER}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(WHATSAPP_NUMBER, 'cod-jc')}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {copied === 'cod-jc' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-orange-700 font-semibold">Payment ke baad screenshot WhatsApp par zaroor bhejein: <strong>{WHATSAPP_NUMBER}</strong></p>
                          <p className="text-gray-500 text-xs">Support available: 10:30 AM – 8:00 PM</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct Bank Transfer */}
                  <div>
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${form.paymentMethod === 'bank_transfer' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                      onClick={() => update('paymentMethod', 'bank_transfer')}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.paymentMethod === 'bank_transfer' ? 'border-orange-500' : 'border-gray-300'}`}>
                        {form.paymentMethod === 'bank_transfer' && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-600" />
                        <span className="text-sm font-bold text-gray-900">Direct bank transfer</span>
                      </div>
                    </label>
                    {form.paymentMethod === 'bank_transfer' && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Bank Account Details</p>
                          <div className="space-y-2 text-sm">
                            {[
                              { label: 'Title', value: BANK_DETAILS.accountTitle },
                              { label: 'IBAN', value: BANK_DETAILS.iban, copyKey: 'iban' },
                              { label: 'Bank', value: BANK_DETAILS.bank },
                            ].map(row => (
                              <div key={row.label} className="flex items-center justify-between">
                                <span className="text-gray-500 w-16 flex-shrink-0">{row.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{row.value}</span>
                                  {row.copyKey && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(row.value, row.copyKey!)}
                                      className="text-gray-400 hover:text-orange-500 transition-colors"
                                    >
                                      {copied === row.copyKey ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mobile Wallet Details</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 w-20 flex-shrink-0">JazzCash</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{BANK_DETAILS.jazzCash}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(BANK_DETAILS.jazzCash, 'jc')}
                                  className="text-gray-400 hover:text-orange-500 transition-colors"
                                >
                                  {copied === 'jc' ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 w-20 flex-shrink-0">Name</span>
                              <span className="font-semibold text-gray-900">{BANK_DETAILS.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                          📸 After sending the payment, please share the screenshot on WhatsApp{' '}
                          <strong>{BANK_DETAILS.whatsapp}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
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
                        <span className="text-gray-700 line-clamp-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                  <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span className="font-semibold text-green-600">Free Shipping</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-base">
                    <span>Total</span><span className="text-orange-500">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

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
