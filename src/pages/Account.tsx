import { useEffect, useState } from 'react';
import { User, Mail, Phone, LogOut, Package, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function Account() {
  const { navigate } = useNavigation();
  const { user, signOut } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('login');
      return;
    }
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  const fullName = (user.user_metadata as Record<string, string>)?.full_name || 'Customer';
  const phone = (user.user_metadata as Record<string, string>)?.phone || '—';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <span className="cursor-pointer hover:text-orange-500" onClick={() => navigate('home')}>Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">My Account</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-xl">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{fullName}</h3>
                  <p className="text-xs text-gray-500">Customer Account</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-orange-400 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-orange-400 flex-shrink-0" />
                  <span>{phone}</span>
                </div>
              </div>
              <button
                onClick={async () => { await signOut(); navigate('home'); }}
                className="w-full mt-5 flex items-center justify-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                <LogOut size={16} />Sign Out
              </button>
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-wide mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-orange-500" />My Orders
              </h3>

              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />)}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">No orders yet.</p>
                  <button onClick={() => navigate('shop')} className="mt-3 bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold text-sm">Start Shopping</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-orange-500 text-sm">{order.order_number}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          <Clock size={12} className="inline mr-1 text-gray-400" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="font-black text-gray-900">Rs. {order.total.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
