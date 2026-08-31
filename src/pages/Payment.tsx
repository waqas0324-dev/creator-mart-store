import { useState } from 'react';
import { CreditCard, Smartphone, Lock, CheckCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

type PayTab = 'card' | 'jazzcash' | 'easypaisa';

export function Payment() {
  const { nav, navigate } = useNavigation();
  const { items, clearCart } = useCart();
  const pending = nav.pendingOrder;
  const [activeTab, setActiveTab] = useState<PayTab>('card');
  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [mobileForm, setMobileForm] = useState({ number: '', pin: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!pending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 font-semibold">No pending payment found.</p>
        <button onClick={() => navigate('checkout')} className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg">Go to Checkout</button>
      </div>
    );
  }

  const formatCardNumber = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (activeTab === 'card') {
      if (cardForm.number.replace(/\s/g, '').length < 16) e.number = 'Enter valid 16-digit card number';
      if (cardForm.expiry.length < 5) e.expiry = 'Enter valid expiry (MM/YY)';
      if (cardForm.cvv.length < 3) e.cvv = 'Enter 3-digit CVV';
      if (!cardForm.name.trim()) e.name = 'Enter cardholder name';
    } else {
      const ph = mobileForm.number.replace(/\D/g, '');
      if (ph.length < 10) e.number = 'Enter valid mobile number';
      if (mobileForm.pin.length < 4) e.pin = 'Enter your 4-digit PIN';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    await new Promise(r => setTimeout(r, 2000));

    const orderNumber = `#ABR${Date.now().toString().slice(-6)}`;
    const { data: order, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_name: pending.customer_name,
      customer_phone: pending.customer_phone,
      customer_email: pending.customer_email || null,
      customer_address: pending.customer_address,
      customer_city: pending.customer_city,
      customer_area: pending.customer_area || null,
      payment_method: activeTab === 'card' ? 'card' : activeTab,
      subtotal: pending.subtotal,
      shipping: pending.shipping,
      total: pending.total,
      status: 'processing',
    }).select().single();

    if (error || !order) {
      setLoading(false);
      setErrors({ general: 'Payment failed. Please try again.' });
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

  const inputCls = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'}`;

  const tabs: { id: PayTab; label: string; icon: string }[] = [
    { id: 'card', label: 'Debit / Credit Card', icon: '💳' },
    { id: 'jazzcash', label: 'JazzCash', icon: '📱' },
    { id: 'easypaisa', label: 'EasyPaisa', icon: '💚' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('checkout')}>Checkout</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-semibold">Payment</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('checkout')} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Secure Payment</h1>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Lock size={12} />
              <span>256-bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{errors.general}</div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="md:col-span-2">
            {/* Payment Method Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
              <div className="flex border-b border-gray-100">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setErrors({}); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handlePay} className="p-5 space-y-4">
                {activeTab === 'card' ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard size={20} className="text-gray-400" />
                      <span className="font-bold text-gray-800">Card Details</span>
                      <div className="ml-auto flex gap-1">
                        {['VISA', 'MC', 'Bank'].map(b => (
                          <span key={b} className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded">{b}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChange={e => setCardForm(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                        className={inputCls('number')}
                        maxLength={19}
                      />
                      {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="As it appears on card"
                        value={cardForm.name}
                        onChange={e => setCardForm(p => ({ ...p, name: e.target.value }))}
                        className={inputCls('name')}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardForm.expiry}
                          onChange={e => setCardForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                          className={inputCls('expiry')}
                          maxLength={5}
                        />
                        {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={cardForm.cvv}
                          onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                          className={inputCls('cvv')}
                          maxLength={3}
                        />
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <Smartphone size={20} className="text-gray-400" />
                      <span className="font-bold text-gray-800">
                        {activeTab === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Mobile Account
                      </span>
                      <div className={`ml-auto text-xs font-black px-3 py-1 rounded-full ${activeTab === 'jazzcash' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {activeTab === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-3">
                      <p className="font-semibold mb-1">How to pay:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Enter your {activeTab === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} registered number</li>
                        <li>Enter your mobile account PIN</li>
                        <li>Click Pay Now to complete payment</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="03xx-xxxxxxx"
                        value={mobileForm.number}
                        onChange={e => setMobileForm(p => ({ ...p, number: e.target.value }))}
                        className={inputCls('number')}
                      />
                      {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Account PIN</label>
                      <input
                        type="password"
                        placeholder="4-digit PIN"
                        value={mobileForm.pin}
                        onChange={e => setMobileForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        className={inputCls('pin')}
                        maxLength={4}
                      />
                      {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">Your payment info is encrypted and secure. We never store card details.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black py-4 rounded-xl transition-colors text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Pay Rs. {pending.total.toLocaleString()}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Order Summary
              </h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">Rs. {pending.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-black text-base">
                  <span>Total</span>
                  <span className="text-orange-500">Rs. {pending.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <p><span className="font-semibold text-gray-700">Name:</span> {pending.customer_name}</p>
                <p><span className="font-semibold text-gray-700">Phone:</span> {pending.customer_phone}</p>
                <p><span className="font-semibold text-gray-700">City:</span> {pending.customer_city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
