import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';

export interface OrderDetailView {
  order: Order | null;
  items: OrderItem[];
  history: OrderStatusHistory[];
}

export async function getOrderDetailView(orderId: string): Promise<OrderDetailView> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_order_detail_view', { order_id: orderId });

    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const result = rpcResult[0];
      return {
        order: result.order_data?.[0] || null,
        items: result.items_data || [],
        history: result.history_data || [],
      };
    }

    const [
      { data: orderData, error: orderError },
      { data: itemsData, error: itemsError },
      { data: historyData, error: historyError },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id_unique_tracking, status, customer_name, phone_number, shipping_address, total_amount, created_at, admin_notes, location_link, instapay_screenshot, instapay_phone_number')
        .eq('id_unique_tracking', orderId)
        .maybeSingle(),
      supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, unit_price')
        .eq('order_id', orderId),
      supabase
        .from('order_status_history')
        .select('id, order_id, status, timestamp')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true }),
    ]);

    if (orderError || itemsError || historyError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch order details:', { orderError, itemsError, historyError });
      }
      return { order: null, items: [], history: [] };
    }

    return {
      order: orderData,
      items: itemsData || [],
      history: historyData || [],
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching order details:', error);
    }
    return { order: null, items: [], history: [] };
  }
}
