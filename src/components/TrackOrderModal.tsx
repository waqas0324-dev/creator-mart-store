import { useState } from 'react';
import { X, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber.trim())
      .single();

    setLoading(false);

    if (fetchError || !data) {
      setError('Order not found. Please check your order number.');
    } else {
      setOrder(data as Order);
    }
  };

  const currentStepIndex = statusSteps.findIndex(s => s.key === order?.status);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Track Your Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSearch} className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">Order Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="e.g. #ABR123456"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {loading ? '...' : 'Track'}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Order Number</p>
                <p className="font-bold text-orange-500">{order.order_number}</p>
                <p className="text-xs text-gray-500 mt-2 mb-1">Customer</p>
                <p className="text-sm font-semibold text-gray-800">{order.customer_name}</p>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="font-bold text-gray-900">Rs. {order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Status Tracker */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-3">Order Status</p>
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.key} className="flex items-start gap-3 pb-4 last:pb-0">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                            <Icon size={14} />
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div className={`absolute left-1/2 top-8 w-0.5 h-6 -translate-x-1/2 ${
                              index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <p className={`font-semibold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-green-600 capitalize">{order.status}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                Order placed on {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
