import { supabase } from './supabase';
import { Order, OrderItem, OrderStatusHistory } from '../types';

export interface OrderDetailView {
  order: Order | null;
  items: OrderItem[];
  history: OrderStatusHistory[];
}

/**
 * Fetch complete order details (order, items, history) in a single RPC call.
 * Replaces 3 separate Supabase queries with 1 RPC function for efficiency.
 * 
 * NOTE: Requires the RPC function `get_order_detail_view` to be created in Supabase:
 * 
 * SQL to execute in Supabase SQL Editor:
 * 
 * CREATE OR REPLACE FUNCTION get_order_detail_view(order_id TEXT)
 * RETURNS TABLE(
 *   order_data JSONB,
 *   items_data JSONB,
 *   history_data JSONB
 * ) AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT 
 *     (SELECT jsonb_agg(row_to_json(o.*)) 
 *      FROM orders o 
 *      WHERE o.id_unique_tracking = order_id 
 *      LIMIT 1) as order_data,
 *     (SELECT jsonb_agg(row_to_json(oi.*)) 
 *      FROM order_items oi 
 *      WHERE oi.order_id = order_id) as items_data,
 *     (SELECT jsonb_agg(row_to_json(osh.* order by osh.timestamp ASC)) 
 *      FROM order_status_history osh 
 *      WHERE osh.order_id = order_id) as history_data;
 * END;
 * $$ LANGUAGE plpgsql;
 */
export async function getOrderDetailView(orderId: string): Promise<OrderDetailView> {
  try {
    // Try RPC-based approach first (requires RPC function to exist)
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_order_detail_view', { order_id: orderId });

    if (!rpcError && rpcResult) {
      const result = rpcResult[0];
      return {
        order: result.order_data?.[0] || null,
        items: result.items_data || [],
        history: result.history_data || [],
      };
    }

    // Fallback: Use 3 separate queries (current approach)
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
