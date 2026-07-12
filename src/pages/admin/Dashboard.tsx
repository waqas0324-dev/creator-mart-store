import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useNavigation } from '../../context/NavigationContext';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function AdminDashboard() {
  const { navigate } = useNavigation();
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ count: products }, { data: orderData }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      const orders = (orderData as Order[]) || [];
      setStats({
        totalProducts: products || 0,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + o.total, 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
      });
      setRecentOrders(orders);
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.totalProducts, Icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: stats.totalOrders, Icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
    { label: 'Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, Icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, Icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <card.Icon size={20} />
              </div>
              <p className="text-2xl font-black text-gray-900 mb-1">{loading ? '—' : card.value}</p>
              <p className="text-sm font-semibold text-gray-700">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', page: 'admin-product-form' as const, primary: true, Icon: Plus },
            { label: 'View Products', page: 'admin-products' as const, primary: false, Icon: Package },
            { label: 'View Orders', page: 'admin-orders' as const, primary: false, Icon: ShoppingBag },
            { label: 'Visit Store', page: 'home' as const, primary: false, Icon: TrendingUp },
          ].map(({ label, page, primary, Icon }) => (
            <button key={label} onClick={() => navigate(page)} className={`flex items-center gap-2 font-bold px-4 py-3 rounded-xl transition-colors ${primary ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'}`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-black text-gray-900">Recent Orders</h3>
            <button onClick={() => navigate('admin-orders')} className="text-sm text-orange-500 hover:text-orange-600 font-semibold">View All</button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-10 bg-gray-100 rounded" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 text-left">Order ID</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-orange-500">{order.order_number}</td>
                      <td className="px-4 py-3 font-semibold">{order.customer_name}</td>
                      <td className="px-4 py-3 font-bold">Rs. {order.total.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
