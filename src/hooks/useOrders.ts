import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    await fetchOrders();
  };

  const updateOwnerNote = async (id: string, owner_note: string) => {
    await supabase.from('orders').update({ owner_note }).eq('id', id);
    await fetchOrders();
  };

  const updateShippingDetails = async (
    id: string,
    details: {
      courier_name: string | null;
      tracking_number: string | null;
      tracking_url: string | null;
      parcel_pieces: number;
      parcel_weight_kg: number | null;
      shipping_note: string | null;
      status?: string;
    }
  ) => {
    const payload = {
      courier_name: details.courier_name ?? null,
      tracking_number: details.tracking_number,
      tracking_url: details.tracking_url ?? null,
      parcel_pieces: details.parcel_pieces,
      parcel_weight_kg: details.parcel_weight_kg,
      shipping_note: details.shipping_note,
      ...(details.status === 'shipped' ? { shipped_at: new Date().toISOString() } : {}),
    };
    await supabase.from('orders').update(payload).eq('id', id);
    await fetchOrders();
  };

  const updatePaymentProof = async (
    id: string,
    status: 'verified' | 'rejected',
    rejectedReason: string | null = null
  ) => {
    const payload = {
      payment_proof_status: status,
      payment_proof_verified_at: status === 'verified' ? new Date().toISOString() : null,
      payment_proof_rejected_reason: status === 'rejected' ? rejectedReason : null,
    };
    const { error } = await supabase.from('orders').update(payload).eq('id', id);
    if (!error) await fetchOrders();
    return error?.message || null;
  };

  const getPaymentProofUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(path, 900);
    return error ? null : data?.signedUrl || null;
  };

  const deleteOrder = async (id: string) => {
    await supabase.from('orders').delete().eq('id', id);
    await fetchOrders();
  };

  return { orders, loading, refetch: fetchOrders, updateOrderStatus, updateOwnerNote, updateShippingDetails, updatePaymentProof, getPaymentProofUrl, deleteOrder };
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setOrder(data as Order);
        setLoading(false);
      });
  }, [id]);

  return { order, loading };
}
