'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { Order, OrderItem, OrderStatusHistory, OrderStatus, CartItem } from '@/types';
import type { CheckoutFormData } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { ORDER_SELECT_FIELDS, ORDER_ITEM_SELECT_FIELDS, STATUS_HISTORY_SELECT_FIELDS } from '@/lib/db-constants';
import { now } from '@/lib/date-utils';

const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  'Pending Review', 'Accepted', 'Processing', 'Delivered', 'Declined', 'Check Internal Note',
] as const;

function isValidOrderStatus(value: string): value is OrderStatus {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(value);
}

const ADMIN_NOTES_MAX_LENGTH = 2000;

const PAGE_SIZE = 50;

export interface OrdersContextType {
  orders: Order[];
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistory[];
  page: number;
  totalPages: number;
  getOrderById: (id: string) => Order | undefined;
  createOrder: (data: CheckoutFormData, cartItems: CartItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateAdminNotes: (orderId: string, notes: string) => void;
  getOrderItems: (orderId: string) => OrderItem[];
  getStatusHistory: (orderId: string) => OrderStatusHistory[];
  clearAllOrders: (password: string) => Promise<void>;
  deleteOrder: (orderId: string) => void;
  refreshOrders: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (n: number) => void;
}

export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const ordersMapRef = useRef<Map<string, Order>>(new Map());
  const orderItemsMapRef = useRef<Map<string, OrderItem[]>>(new Map());
  const statusHistoryMapRef = useRef<Map<string, OrderStatusHistory[]>>(new Map());
  const ordersRef = useRef<Order[]>([]);
  const orderItemsRef = useRef<OrderItem[]>([]);
  const statusHistoryRef = useRef<OrderStatusHistory[]>([]);
  const pageRef = useRef(0);

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

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const getOrderItems = useCallback((orderId: string) => {
    return orderItemsMapRef.current.get(orderId) || [];
  }, []);

  const getStatusHistory = useCallback((orderId: string) => {
    return statusHistoryMapRef.current.get(orderId) || [];
  }, []);

  const loadData = useCallback(async (pageNum = 0) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: oData, error: oError, count: oCount } = await supabase
        .from('orders')
        .select(ORDER_SELECT_FIELDS, { count: 'exact', head: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (oError) throw oError;

      const orderIds = (oData || []).map(o => o.id_unique_tracking);

      const [oiResult, hResult] = await Promise.all([
        orderIds.length > 0
          ? supabase.from('order_items').select(ORDER_ITEM_SELECT_FIELDS).in('order_id', orderIds)
          : { data: [] as OrderItem[], error: null },
        orderIds.length > 0
          ? supabase.from('order_status_history').select(STATUS_HISTORY_SELECT_FIELDS).in('order_id', orderIds)
          : { data: [] as OrderStatusHistory[], error: null },
      ]);

      setOrders(oData || []);
      setOrderItems(oiResult.data || []);
      setStatusHistory(hResult.data || []);
      setTotalPages(oCount ? Math.ceil(oCount / PAGE_SIZE) : 0);
      setPage(pageNum);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to load orders/items/logs from Supabase:', error);
      setOrders([]);
      setOrderItems([]);
      setStatusHistory([]);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    await loadData(page);
  }, [loadData, page]);

  const nextPage = useCallback(() => {
    if (page < totalPages - 1) {
      loadData(page + 1);
    }
  }, [page, totalPages, loadData]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      loadData(page - 1);
    }
  }, [page, loadData]);

  const goToPage = useCallback((n: number) => {
    if (n >= 0 && n < totalPages) {
      loadData(n);
    }
  }, [totalPages, loadData]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe(session: unknown) {
      if (channel || !session) return;

      channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new as Order;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime INSERT order:', newOrder);
            setOrders((prev) => {
              if (prev.some((o) => o.id_unique_tracking === newOrder.id_unique_tracking)) return prev;
              return [newOrder, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new as Order;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime UPDATE order:', updatedOrder);
            setOrders((prev) =>
              prev.map((o) =>
                o.id_unique_tracking === updatedOrder.id_unique_tracking ? updatedOrder : o
              )
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          (payload) => {
            const deletedOrder = payload.old as { id_unique_tracking: string };
            if (process.env.NODE_ENV !== 'production') console.log('Realtime DELETE order:', deletedOrder);
            setOrders((prev) =>
              prev.filter((o) => o.id_unique_tracking !== deletedOrder.id_unique_tracking)
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_items' },
          (payload) => {
            const newItem = payload.new as OrderItem;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime INSERT order item:', newItem);
            setOrderItems((prev) => {
              if (prev.some((item) => item.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'order_items' },
          (payload) => {
            const updatedItem = payload.new as OrderItem;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime UPDATE order item:', updatedItem);
            setOrderItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'order_items' },
          (payload) => {
            const deletedId = payload.old.id;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime DELETE order item ID:', deletedId);
            setOrderItems((prev) => prev.filter((item) => item.id !== deletedId));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'order_status_history' },
          (payload) => {
            const newHistory = payload.new as OrderStatusHistory;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime INSERT status history:', newHistory);
            setStatusHistory((prev) => {
              if (prev.some((h) => h.id === newHistory.id)) return prev;
              return [...prev, newHistory];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'order_status_history' },
          (payload) => {
            const deletedId = payload.old.id;
            if (process.env.NODE_ENV !== 'production') console.log('Realtime DELETE status history ID:', deletedId);
            setStatusHistory((prev) => prev.filter((h) => h.id !== deletedId));
          }
        )
        .subscribe((status) => {
          if (process.env.NODE_ENV !== 'production') console.log('Supabase Realtime orders channel status:', status);
        });
    }

    function unsubscribe() {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadData(0);
        await subscribe(session);
      } else {
        unsubscribe();
        setOrders([]);
        setOrderItems([]);
        setStatusHistory([]);
      }
    });

    // Immediately subscribe if a session already exists (fix: realtime not starting without refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadData(0);
        subscribe(session);
      }
    });

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await subscribe(session);
          loadData(pageRef.current);
        }
      } else {
        unsubscribe();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
      subscription.unsubscribe();
    };
  }, [loadData]);

  const getOrderById = useCallback((id: string) => {
    return ordersMapRef.current.get(id.toUpperCase());
  }, []);

  const createOrder = useCallback(async (data: CheckoutFormData, cartItems: CartItem[]): Promise<Order> => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, cartItems }),
    })

    const result = await response.json()

    if (!response.ok) {
      if (result.fieldErrors) {
        const firstError = Object.values(result.fieldErrors)[0]
        throw new Error(typeof firstError === 'string' ? firstError : 'بيانات غير صالحة.')
      }
      throw new Error(result.error || 'فشل إنشاء الطلب.')
    }

    const trackingId = result.trackingId
    const timestamp = now()
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    )

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
      instapay_screenshot: data.instapay_screenshot,
      instapay_phone_number: data.instapay_phone_number,
    }

    const newItems: OrderItem[] = cartItems.map((item, index) => ({
      id: `oi-${trackingId}-${index}`,
      order_id: trackingId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
    }))

    const initialHistory: OrderStatusHistory = {
      id: `h-${trackingId}-init`,
      order_id: trackingId,
      status: 'Pending Review',
      timestamp,
    }

    setOrders((prev) => [newOrder, ...prev])
    setOrderItems((prev) => [...prev, ...newItems])
    setStatusHistory((prev) => [...prev, initialHistory])

    return newOrder
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!isValidOrderStatus(status)) {
      if (process.env.NODE_ENV !== 'production') console.error(`Invalid order status: "${status}"`);
      return;
    }

    const timestamp = now();
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
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setOrders(previousOrders);
        setStatusHistory(previousHistory);
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order status');
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
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      });

      if (!response.ok) {
        setOrders(previousOrders);
        const data = await response.json();
        throw new Error(data.error || 'Failed to update admin notes');
      }
    } catch (e) {
      setOrders(previousOrders);
      throw e;
    }
  }, []);

  const clearAllOrders = useCallback(async (password: string) => {
    const previousOrders = ordersRef.current;
    const previousItems = orderItemsRef.current;
    const previousHistory = statusHistoryRef.current;

    setOrders([]);
    setOrderItems([]);
    setStatusHistory([]);

    try {
      const response = await fetch('/api/admin/orders/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
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
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete order');
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
      page,
      totalPages,
      getOrderById,
      createOrder,
      updateOrderStatus,
      updateAdminNotes,
      getOrderItems,
      getStatusHistory,
      clearAllOrders,
      deleteOrder,
      refreshOrders,
      nextPage,
      prevPage,
      goToPage,
    }),
    [
      orders,
      orderItems,
      statusHistory,
      page,
      totalPages,
      getOrderById,
      createOrder,
      updateOrderStatus,
      updateAdminNotes,
      getOrderItems,
      getStatusHistory,
      clearAllOrders,
      deleteOrder,
      refreshOrders,
      nextPage,
      prevPage,
      goToPage,
    ]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
