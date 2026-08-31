import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, ShoppingBag, Home as HomeIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../context/NavigationContext';
import { onImageError } from '../lib/imageFallback';
import type { Order } from '../types';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', desc: 'Your order has been received and is being confirmed.', icon: Clock },
  { key: 'processing', label: 'Processing', desc: 'Your order is being prepared for shipment.', icon: Package },
  { key: 'shipped', label: 'Shipped', desc: 'Your order is on the way to your address.', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Your order has been delivered successfully.', icon: CheckCircle },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function TrackOrderPage() {
  const { navigate } = useNavigation();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber.trim())
      .maybeSingle();

    setLoading(false);

    if (fetchError || !data) {
      setError('Order not found. Please check your order number and try again.');
    } else {
      setOrder(data as Order);
    }
  };

  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <button onClick={() => navigate('home')} className="hover:text-orange-500 flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </button>
            <span>/</span>
            <span className="text-gray-600 font-semibold">Track Order</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <MapPin size={24} className="text-orange-500" />
            Track Your Order
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your order tracking ID below to see the current status of your order.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Search Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-bold text-gray-700 mb-2">Order Tracking ID</label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  placeholder="e.g. #ABR123456"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                {loading ? 'Searching...' : 'Track Now'}
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package size={24} className="text-red-400" />
            </div>
            <p className="text-red-600 font-bold text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">
              Your order tracking ID was sent to your phone via SMS and also shown on the order confirmation page.
            </p>
          </div>
        )}

        {/* Order Found */}
        {order && !error && (
          <div className="space-y-5">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-100 uppercase tracking-wide">Order Number</p>
                    <p className="text-xl font-black">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-orange-100 uppercase tracking-wide">Status</p>
                    <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Customer</p>
                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Phone</p>
                    <p className="font-semibold text-gray-800">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">City</p>
                    <p className="font-semibold text-gray-800">{order.customer_city}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Total Amount</p>
                    <p className="font-bold text-orange-500">Rs. {order.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Payment Method</p>
                    <p className="font-semibold text-gray-800 capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Order Date</p>
                    <p className="font-semibold text-gray-800">{new Date(order.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            {!isCancelled ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 mb-1">Order Tracking Timeline</h2>
                <p className="text-gray-400 text-xs mb-6">Follow your order journey from placement to delivery</p>

                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                      <div key={step.key} className="flex items-start gap-4 pb-8 last:pb-0 relative">
                        {/* Connector line */}
                        {!isLast && (
                          <div className={`absolute left-[19px] top-10 w-0.5 h-[calc(100%-2rem)] ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}

                        {/* Icon circle */}
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-green-200 scale-110' : ''}`}>
                          <Icon size={18} />
                          {isCompleted && !isCurrent && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                              <CheckCircle size={12} className="text-green-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pt-1.5 transition-all ${isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                          <p className={`font-bold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          <p className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                            {step.desc}
                          </p>
                          {isCurrent && (
                            <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                              Current Status
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={24} className="text-red-400" />
                </div>
                <p className="text-red-600 font-bold">This order has been cancelled.</p>
              </div>
            )}

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-orange-500" />
                  Items in This Order
                </h2>
                <div className="space-y-3">
                  {order.order_items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 pb-3 last:pb-0 border-b border-gray-50 last:border-0">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          referrerPolicy="no-referrer"
                          onError={(e) => onImageError(e, item.product_name)}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Rs. {item.price.toLocaleString()} x {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900">Rs. {item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-700">Rs. {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-1">
                    <span>Total</span>
                    <span className="text-orange-500">Rs. {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" />
                Delivery Address
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">{order.customer_name}</p>
                <p>{order.customer_address}</p>
                <p>{order.customer_city}{order.customer_area ? `, ${order.customer_area}` : ''}</p>
                <p>{order.customer_phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - before search */}
        {!searched && !order && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={32} className="text-orange-400" />
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-1">Track Your Shipment</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Enter your order tracking ID above to see real-time updates on your order status — from processing to shipping to delivery.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {statusSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
                    <Icon size={16} className="text-orange-400" />
                    <span className="text-xs font-semibold text-gray-600">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
