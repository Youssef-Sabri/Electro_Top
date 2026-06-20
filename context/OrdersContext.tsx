'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { Order, OrderItem, OrderStatusHistory, OrderStatus, CartItem } from '@/types';
import { generateOrderId } from '@/lib/id-generator';
import type { CheckoutFormData } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { clearAllReceipts, deleteReceiptImage } from '@/lib/image-utils';
import { logAdminAction } from '@/lib/audit-log';

const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  'Pending Review', 'Accepted', 'Processing', 'Delivered', 'Declined', 'Check Internal Note',
] as const;

function isValidOrderStatus(value: string): value is OrderStatus {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(value);
}

const ADMIN_NOTES_MAX_LENGTH = 2000;

export interface OrdersContextType {
  orders: Order[];
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistory[];
  getOrderById: (id: string) => Order | undefined;
  createOrder: (data: CheckoutFormData, cartItems: CartItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: string) => void;
  updateAdminNotes: (orderId: string, notes: string) => void;
  getOrderItems: (orderId: string) => OrderItem[];
  getStatusHistory: (orderId: string) => OrderStatusHistory[];
  clearAllOrders: () => void;
  deleteOrder: (orderId: string) => void;
  refreshOrders: () => Promise<void>;
}

export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);

  const ordersMapRef = useRef<Map<string, Order>>(new Map());
  const orderItemsMapRef = useRef<Map<string, OrderItem[]>>(new Map());
  const statusHistoryMapRef = useRef<Map<string, OrderStatusHistory[]>>(new Map());
  const ordersRef = useRef<Order[]>([]);
  const orderItemsRef = useRef<OrderItem[]>([]);
  const statusHistoryRef = useRef<OrderStatusHistory[]>([]);

  useEffect(() => {
    const oMap = new Map<string, Order>();
    for (const o of orders) {
      oMap.set(o.id_unique_tracking.toUpperCase(), o);
    }
    ordersMapRef.current = oMap;

    const oiMap = new Map<string, OrderItem[]>();
    for (const item of orderItems) {
      const existing = oiMap.get(item.order_id);
      oiMap.set(item.order_id, existing ? [...existing, item] : [item]);
    }
    orderItemsMapRef.current = oiMap;

    const shMap = new Map<string, OrderStatusHistory[]>();
    for (const h of statusHistory) {
      const existing = shMap.get(h.order_id);
      shMap.set(h.order_id, existing ? [...existing, h] : [h]);
    }
    statusHistoryMapRef.current = shMap;
    ordersRef.current = orders;
    orderItemsRef.current = orderItems;
    statusHistoryRef.current = statusHistory;
  }, [orders, orderItems, statusHistory]);

  const getOrderItems = useCallback((orderId: string) => {
    return orderItemsMapRef.current.get(orderId) || [];
  }, []);

  const getStatusHistory = useCallback((orderId: string) => {
    return statusHistoryMapRef.current.get(orderId) || [];
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [
        { data: oData, error: oError },
        { data: oiData, error: oiError },
        { data: hData, error: hError },
      ] = await Promise.all([
        supabase.from('orders').select('id_unique_tracking, status, customer_name, phone_number, shipping_address, total_amount, created_at, admin_notes, location_link, instapay_screenshot, instapay_phone_number').order('created_at', { ascending: false }),
        supabase.from('order_items').select('id, order_id, product_id, quantity, unit_price'),
        supabase.from('order_status_history').select('id, order_id, status, timestamp'),
      ]);

      setOrders(oData && !oError ? oData : []);
      setOrderItems(oiData && !oiError ? oiData : []);
      setStatusHistory(hData && !hError ? hData : []);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to load orders/items/logs from Supabase:', error);
      setOrders([]);
      setOrderItems([]);
      setStatusHistory([]);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadData();
      } else {
        setOrders([]);
        setOrderItems([]);
        setStatusHistory([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeIfAdmin() {
      if (channel) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => { loadData(); }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          () => { loadData(); }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_status_history' },
          () => { loadData(); }
        )
        .subscribe();
    }

    function unsubscribe() {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    subscribeIfAdmin();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        subscribeIfAdmin();
        loadData();
      } else {
        unsubscribe();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [loadData]);

  const getOrderById = useCallback((id: string) => {
    return ordersMapRef.current.get(id.toUpperCase());
  }, []);

  const createOrder = useCallback(async (data: CheckoutFormData, cartItems: CartItem[]): Promise<Order> => {
    const trackingId = generateOrderId();
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const timestamp = new Date().toISOString();

    const screenshotUrl = data.instapay_screenshot;

    const newOrder: Order = {
      id_unique_tracking: trackingId,
      status: 'Pending Review',
      customer_name: data.customer_name,
      phone_number: data.phone_number,
      shipping_address: data.shipping_address,
      total_amount: totalAmount,
      created_at: timestamp,
      admin_notes: '',
      location_link: data.location_link,
      instapay_screenshot: screenshotUrl,
      instapay_phone_number: data.instapay_phone_number,
    };

    const newItems: OrderItem[] = cartItems.map((item, index) => ({
      id: `oi-${trackingId}-${index}`,
      order_id: trackingId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
    }));

    const initialHistory: OrderStatusHistory = {
      id: `h-${trackingId}-init`,
      order_id: trackingId,
      status: 'Pending Review',
      timestamp,
    };

    const { error: oErr } = await supabase.from('orders').insert([newOrder]);
    if (oErr) {
      throw new Error(oErr.message);
    }

    const [
      { error: oiErr },
      { error: hErr },
    ] = await Promise.all([
      supabase.from('order_items').insert(newItems),
      supabase.from('order_status_history').insert([initialHistory]),
    ]);

    if (oiErr || hErr) {
      await supabase.from('orders').delete().eq('id_unique_tracking', trackingId).maybeSingle();
      if (oiErr) {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to insert order items records:', oiErr);
        throw new Error('ÙØ´Ù„ Ø­ÙØ¸ Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ø·Ù„Ø¨. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
      }
      if (hErr) {
        if (process.env.NODE_ENV !== 'production') console.error('Failed to insert status history logs:', hErr);
        throw new Error('ÙØ´Ù„ Ø­ÙØ¸ Ø³Ø¬Ù„ Ø§Ù„Ø·Ù„Ø¨. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
      }
    }

    setOrders((prev) => [newOrder, ...prev]);
    setOrderItems((prev) => [...prev, ...newItems]);
    setStatusHistory((prev) => [...prev, initialHistory]);

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    if (!isValidOrderStatus(status)) {
      if (process.env.NODE_ENV !== 'production') console.error(`Invalid order status: "${status}"`);
      return;
    }

    const timestamp = new Date().toISOString();
    const historyId = `h-${orderId}-${Date.now()}`;

    const newHistoryEntry: OrderStatusHistory = {
      id: historyId,
      order_id: orderId,
      status,
      timestamp,
    };

    const previousOrders = ordersRef.current;
    const previousHistory = statusHistoryRef.current;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id_unique_tracking === orderId ? { ...order, status } : order
      )
    );
    setStatusHistory((prevHistory) => [...prevHistory, newHistoryEntry]);

    try {
      await logAdminAction('update_order_status', { order_id: orderId, new_status: status });

      const [{ error: oErr }, { error: hErr }] = await Promise.all([
        supabase.from('orders').update({ status }).eq('id_unique_tracking', orderId),
        supabase.from('order_status_history').insert([newHistoryEntry]),
      ]);
      if (oErr || hErr) {
        setOrders(previousOrders);
        setStatusHistory(previousHistory);
        throw new Error(oErr?.message || hErr?.message || 'Failed to update order status');
      }
    } catch (e) {
      setOrders(previousOrders);
      setStatusHistory(previousHistory);
      throw e;
    }
  }, []);

  const updateAdminNotes = useCallback(async (orderId: string, notes: string) => {
    if (notes.length > ADMIN_NOTES_MAX_LENGTH) {
      if (process.env.NODE_ENV !== 'production') console.error(`Admin notes exceed ${ADMIN_NOTES_MAX_LENGTH} characters`);
      return;
    }

    const previousOrders = ordersRef.current;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id_unique_tracking === orderId ? { ...order, admin_notes: notes } : order
      )
    );

    try {
      await logAdminAction('update_admin_notes', { order_id: orderId, notes_length: notes.length });

      const { error } = await supabase
        .from('orders')
        .update({ admin_notes: notes })
        .eq('id_unique_tracking', orderId);

      if (error) {
        setOrders(previousOrders);
        throw new Error(error.message);
      }
    } catch (e) {
      setOrders(previousOrders);
      throw e;
    }
  }, []);

  const clearAllOrders = useCallback(async () => {
    const previousOrders = ordersRef.current;
    const previousItems = orderItemsRef.current;
    const previousHistory = statusHistoryRef.current;

    setOrders([]);
    setOrderItems([]);
    setStatusHistory([]);

    try {
      await logAdminAction('clear_all_orders', { count: previousOrders.length });

      await clearAllReceipts();

      const response = await fetch('/api/admin/orders/clear', { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear orders');
      }
    } catch (e) {
      setOrders(previousOrders);
      setOrderItems(previousItems);
      setStatusHistory(previousHistory);
      throw e;
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    const orderToDelete = ordersMapRef.current.get(orderId);
    if (!orderToDelete) return;

    setOrders((prev) => prev.filter((o) => o.id_unique_tracking !== orderId));
    setOrderItems((prev) => prev.filter((item) => item.order_id !== orderId));
    setStatusHistory((prev) => prev.filter((h) => h.order_id !== orderId));

    try {
      await logAdminAction('delete_order', { order_id: orderId, customer: orderToDelete.customer_name });

      const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete order');
      }

      if (orderToDelete.instapay_screenshot) {
        await deleteReceiptImage(orderToDelete.instapay_screenshot);
      }
    } catch (e) {
      await loadData();
      throw e;
    }
  }, [loadData]);

  const value = useMemo(
    () => ({
      orders,
      orderItems,
      statusHistory,
      getOrderById,
      createOrder,
      updateOrderStatus,
      updateAdminNotes,
      getOrderItems,
      getStatusHistory,
      clearAllOrders,
      deleteOrder,
      refreshOrders,
    }),
    [
      orders,
      orderItems,
      statusHistory,
      getOrderById,
      createOrder,
      updateOrderStatus,
      updateAdminNotes,
      getOrderItems,
      getStatusHistory,
      clearAllOrders,
      deleteOrder,
      refreshOrders,
    ]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
