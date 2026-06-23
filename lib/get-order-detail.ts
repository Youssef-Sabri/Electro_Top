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

    if (rpcError || !rpcResult || rpcResult.length === 0) {
      if (process.env.NODE_ENV !== 'production' && rpcError) {
        console.error('Failed to fetch order details via RPC:', rpcError);
      }
      return { order: null, items: [], history: [] };
    }

    const result = rpcResult[0];
    return {
      order: result.order_data?.[0] || null,
      items: result.items_data || [],
      history: result.history_data || [],
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching order details:', error);
    }
    return { order: null, items: [], history: [] };
  }
}
