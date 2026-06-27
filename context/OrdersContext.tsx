'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { Order, OrderItem, OrderStatusHistory, OrderStatus } from '@/types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TABLES, ORDER_SELECT_FIELDS, ORDER_ITEM_SELECT_FIELDS, STATUS_HISTORY_SELECT_FIELDS, VALID_ORDER_STATUSES, ADMIN_NOTES_MAX_LENGTH } from '@/lib/db-constants';
import { devLog } from '@/lib/dev-log';
import { normalizeTrackingId } from '@/lib/constants';

function isValidOrderStatus(value: string): value is OrderStatus {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(value);
}

export interface OrderFilters {
  searchQuery: string;
  status: string;
}

const PAGE_SIZE = 50;

export interface OrdersContextType {
  orders: Order[];
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistory[];
  page: number;
  totalPages: number;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  getOrderById: (id: string) => Order | undefined;
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
  globalCounts: {
    totalCount: number;
    pendingCount: number;
    activeFulfillmentCount: number;
    completedCount: number;
  };
}

export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>({ searchQuery: '', status: 'All' });
  const [globalCounts, setGlobalCounts] = useState({
    totalCount: 0,
    pendingCount: 0,
    activeFulfillmentCount: 0,
    completedCount: 0,
  });

  const ordersMapRef = useRef<Map<string, Order>>(new Map());
  const orderItemsMapRef = useRef<Map<string, OrderItem[]>>(new Map());
  const statusHistoryMapRef = useRef<Map<string, OrderStatusHistory[]>>(new Map());
  const ordersRef = useRef<Order[]>([]);
  const orderItemsRef = useRef<OrderItem[]>([]);
  const statusHistoryRef = useRef<OrderStatusHistory[]>([]);
  const pageRef = useRef(0);
  const filtersRef = useRef(filters);

  useEffect(() => {
    const oMap = new Map<string, Order>();
    for (const o of orders) {
      oMap.set(normalizeTrackingId(o.id_unique_tracking), o);
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

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const getOrderItems = useCallback((orderId: string) => {
    return orderItemsMapRef.current.get(orderId) || [];
  }, []);

  const getStatusHistory = useCallback((orderId: string) => {
    return statusHistoryMapRef.current.get(orderId) || [];
  }, []);

  const loadData = useCallback(async (pageNum = 0, overrideFilters?: OrderFilters) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const activeFilters = overrideFilters ?? filtersRef.current;

      let query = supabase
        .from(TABLES.orders)
        .select(ORDER_SELECT_FIELDS, { count: 'exact', head: false });

      const searchTerm = activeFilters.searchQuery.trim().toLowerCase();
      if (searchTerm) {
        query = query.or(
          `id_unique_tracking.ilike.%${searchTerm}%,` +
          `customer_name.ilike.%${searchTerm}%,` +
          `phone_number.ilike.%${searchTerm}%,` +
          `instapay_phone_number.ilike.%${searchTerm}%`
        );
      }

      if (activeFilters.status !== 'All') {
        const statusValue = activeFilters.status === 'Pending' ? 'Pending Review' : activeFilters.status;
        query = query.eq('status', statusValue);
      }

      const { data: oData, error: oError, count: oCount } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (oError) throw oError;

      const orderIds = (oData || []).map(o => o.id_unique_tracking);

        const [oiResult, hResult, statusesResult] = await Promise.all([
          orderIds.length > 0
            ? supabase.from(TABLES.orderItems).select(ORDER_ITEM_SELECT_FIELDS).in('order_id', orderIds)
            : { data: [] as OrderItem[], error: null },
          orderIds.length > 0
            ? supabase.from(TABLES.orderStatusHistory).select(STATUS_HISTORY_SELECT_FIELDS).in('order_id', orderIds)
            : { data: [] as OrderStatusHistory[], error: null },
          fetch('/api/admin/order-counts').then(async res => ({ data: await res.json(), error: res.ok ? null : 'Failed' })),
        ]);

      setOrders(oData || []);
      setOrderItems(oiResult.data || []);
      setStatusHistory(hResult.data || []);
      setTotalPages(oCount ? Math.ceil(oCount / PAGE_SIZE) : 0);
      setPage(pageNum);

      const countRows: { status: string; count: number }[] = statusesResult.data || [];
      const countMap = new Map(countRows.map(r => [r.status, r.count]));
      setGlobalCounts({
        totalCount: countRows.reduce((sum, r) => sum + r.count, 0),
        pendingCount: countMap.get('Pending Review') || 0,
        activeFulfillmentCount: (countMap.get('Processing') || 0) + (countMap.get('Accepted') || 0),
        completedCount: countMap.get('Delivered') || 0,
      });
    } catch (error) {
      devLog('Failed to load orders/items/logs from Supabase:', error);
      setOrders([]);
      setOrderItems([]);
      setStatusHistory([]);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    await loadData(pageRef.current, filtersRef.current);
  }, [loadData]);

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
    let subscribing = false;

    async function subscribe(session: Session) {
      if (channel || subscribing || !session) return;
      subscribing = true;
      try {
        const newChannel = supabase.channel('orders-realtime');

        newChannel
          .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: TABLES.orders },
          (payload) => {
            const newOrder = payload.new as Order;
            setOrders((prev) => {
              if (prev.some((o) => o.id_unique_tracking === newOrder.id_unique_tracking)) return prev;
              return [newOrder, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: TABLES.orders },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) =>
                o.id_unique_tracking === updatedOrder.id_unique_tracking ? updatedOrder : o
              )
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: TABLES.orders },
          (payload) => {
            const deletedOrder = payload.old as { id_unique_tracking: string };
            setOrders((prev) =>
              prev.filter((o) => o.id_unique_tracking !== deletedOrder.id_unique_tracking)
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: TABLES.orderItems },
          (payload) => {
            const newItem = payload.new as OrderItem;
            setOrderItems((prev) => {
              if (prev.some((item) => item.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: TABLES.orderItems },
          (payload) => {
            const updatedItem = payload.new as OrderItem;
            setOrderItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: TABLES.orderItems },
          (payload) => {
            const deletedId = payload.old.id;
            setOrderItems((prev) => prev.filter((item) => item.id !== deletedId));
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: TABLES.orderStatusHistory },
          (payload) => {
            const newHistory = payload.new as OrderStatusHistory;
            setStatusHistory((prev) => {
              if (prev.some((h) => h.id === newHistory.id)) return prev;
              return [...prev, newHistory];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: TABLES.orderStatusHistory },
          (payload) => {
            const deletedId = payload.old.id;
            setStatusHistory((prev) => prev.filter((h) => h.id !== deletedId));
          }
        )
        channel = newChannel;
        newChannel.subscribe();
      } finally {
        subscribing = false;
      }
    }

    function unsubscribe() {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadData(0, filtersRef.current);
        await subscribe(session);
      } else {
        unsubscribe();
        setOrders([]);
        setOrderItems([]);
        setStatusHistory([]);
      }
    });

    // onAuthStateChange automatically fires with initial session on mount, no redundant call needed.

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await subscribe(session);
          loadData(pageRef.current, filtersRef.current);
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
    return ordersMapRef.current.get(normalizeTrackingId(id));
  }, []);


  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!isValidOrderStatus(status)) {
      devLog(`Invalid order status: "${status}"`);
      return;
    }

    const previousOrders = ordersRef.current;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id_unique_tracking === orderId ? { ...order, status } : order
      )
    );

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setOrders(previousOrders);
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (e) {
      setOrders(previousOrders);
      throw e;
    }
  }, []);

  const updateAdminNotes = useCallback(async (orderId: string, notes: string) => {
    if (notes.length > ADMIN_NOTES_MAX_LENGTH) {
      devLog(`Admin notes exceed ${ADMIN_NOTES_MAX_LENGTH} characters`);
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
      filters,
      setFilters,
      getOrderById,
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
      globalCounts,
    }),
    [
      orders,
      orderItems,
      statusHistory,
      page,
      totalPages,
      filters,
      getOrderById,
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
      globalCounts,
    ]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
