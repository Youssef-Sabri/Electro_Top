'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Order, OrderItem, OrderStatusHistory, OrderStatus } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { TABLES, ORDER_SELECT_FIELDS, VALID_ORDER_STATUSES, ADMIN_NOTES_MAX_LENGTH } from '@/lib/constants';
import { devLog, normalizeTrackingId } from '@/lib/utils/misc';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';

function isValidOrderStatus(value: string): value is OrderStatus {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(value);
}

interface OrderFilters {
  searchQuery: string;
  status: string;
}

const PAGE_SIZE = 50;

export interface OrdersContextType {
  orders: Order[];
  isLoading: boolean;
  orderItems: OrderItem[];
  statusHistory: OrderStatusHistory[];
  page: number;
  totalPages: number;
  filters: OrderFilters;
  setFilters: (filters: OrderFilters) => void;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateAdminNotes: (orderId: string, notes: string) => Promise<void>;
  getOrderItems: (orderId: string) => OrderItem[];
  getStatusHistory: (orderId: string) => OrderStatusHistory[];
  clearAllOrders: (password: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>({
    searchQuery: '',
    status: 'All',
  });
  const [globalCounts, setGlobalCounts] = useState({
    totalCount: 0,
    pendingCount: 0,
    activeFulfillmentCount: 0,
    completedCount: 0,
  });

  // Derived maps via useMemo instead of ref-mirroring-state
  const ordersMap = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of orders) {
      map.set(normalizeTrackingId(o.id_unique_tracking), o);
    }
    return map;
  }, [orders]);

  const orderItemsMap = useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    for (const item of orderItems) {
      const existing = map.get(item.order_id);
      map.set(item.order_id, existing ? [...existing, item] : [item]);
    }
    return map;
  }, [orderItems]);

  const statusHistoryMap = useMemo(() => {
    const map = new Map<string, OrderStatusHistory[]>();
    for (const h of statusHistory) {
      const existing = map.get(h.order_id);
      map.set(h.order_id, existing ? [...existing, h] : [h]);
    }
    return map;
  }, [statusHistory]);

  const getOrderItems = useCallback((orderId: string) => {
    return orderItemsMap.get(orderId) || [];
  }, [orderItemsMap]);

  const getStatusHistory = useCallback((orderId: string) => {
    return statusHistoryMap.get(orderId) || [];
  }, [statusHistoryMap]);

  const lastCountsFetchRef = useRef<number>(0);

  const fetchGlobalCounts = useCallback(async () => {
    const nowMs = Date.now();
    if (nowMs - lastCountsFetchRef.current < 30_000) return;
    try {
      const res = await fetch('/api/admin/order-counts');
      if (!res.ok) return;
      const data = await res.json();
      const countRows = Array.isArray(data) ? data : [];
      const countMap = new Map(countRows.map((r: { status: string; count: number }) => [r.status, r.count]));
      setGlobalCounts({
        totalCount: countRows.reduce((sum: number, r: { count: number }) => sum + r.count, 0),
        pendingCount: countMap.get('Pending Review') || 0,
        activeFulfillmentCount: (countMap.get('Processing') || 0) + (countMap.get('Accepted') || 0),
        completedCount: countMap.get('Delivered') || 0,
      });
      lastCountsFetchRef.current = nowMs;
    } catch {
      // Silently fail — counts are non-critical
    }
  }, []);

  const loadData = useCallback(async (pageNum = 0, overrideFilters?: OrderFilters) => {
    setIsLoading(true);
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from(TABLES.orders)
        .select(ORDER_SELECT_FIELDS, { count: 'exact', head: false });

      const activeFilters = overrideFilters ?? filters;
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

      setOrders(oData || []);
      setTotalPages(oCount ? Math.ceil(oCount / PAGE_SIZE) : 0);
    } catch (error) {
      devLog('Failed to load orders from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch global counts when on admin routes
  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate async data fetch
      fetchGlobalCounts();
    }
  }, [fetchGlobalCounts, pathname]);

  // Synchronize URL changes back to state (handles back/forward navigation)
  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return;

    if (pathname !== '/admin/orders') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate URL-to-state sync
      setFilters({ searchQuery: '', status: 'All' });
      setPage(0);
      return;
    }

    const urlStatus = searchParams?.get('status') || 'All';
    const urlSearch = searchParams?.get('search') || '';
    const urlPage = parseInt(searchParams?.get('page') || '0', 10);

    setFilters((prev) => {
      if (prev.searchQuery === urlSearch && prev.status === urlStatus) return prev;
      return { searchQuery: urlSearch, status: urlStatus };
    });
    setPage((prev) => {
      if (prev === urlPage) return prev;
      return urlPage;
    });
  }, [pathname, searchParams]);

  // Debounced data fetching and URL state sync
  useEffect(() => {
    if (!pathname?.startsWith('/admin')) return;

    const timer = setTimeout(() => {
      // Sync URL state on admin/orders page
      if (pathname === '/admin/orders') {
        const params = new URLSearchParams();
        if (filters.status !== 'All') params.set('status', filters.status);
        if (filters.searchQuery) params.set('search', filters.searchQuery);
        if (page > 0) params.set('page', page.toString());

        const nextSearch = params.toString() ? `?${params.toString()}` : '';
        if (nextSearch !== window.location.search) {
          window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}`);
        }
      }

      // Fetch data if authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          loadData(page, filters);
        }
      });
    }, filters.searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [filters, page, loadData, pathname]);

  const refreshOrders = useCallback(async () => {
    await loadData(page, filters);
  }, [loadData, page, filters]);

  const nextPage = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(p => Math.max(0, p - 1));
  }, []);

  const goToPage = useCallback((n: number) => {
    if (n >= 0) {
      setPage(n);
    }
  }, []);

  const updateFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  useRealtimeOrders({ setOrders, setOrderItems, setStatusHistory, pathname });

  const getOrderById = useCallback((id: string) => {
    return ordersMap.get(normalizeTrackingId(id));
  }, [ordersMap]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!isValidOrderStatus(status)) {
      devLog(`Invalid order status: "${status}"`);
      return;
    }

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
        const data = await response.json();
        throw new Error(data.error || 'Failed to update order status');
      }
      fetchGlobalCounts();
    } catch (e) {
      // Rollback on failure — reload from server
      await loadData(page, filters);
      throw e;
    }
  }, [fetchGlobalCounts, loadData, page, filters]);

  const updateAdminNotes = useCallback(async (orderId: string, notes: string) => {
    if (notes.length > ADMIN_NOTES_MAX_LENGTH) {
      devLog(`Admin notes exceed ${ADMIN_NOTES_MAX_LENGTH} characters`);
      return;
    }

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
        const data = await response.json();
        throw new Error(data.error || 'Failed to update admin notes');
      }
    } catch (e) {
      await loadData(page, filters);
      throw e;
    }
  }, [loadData, page, filters]);

  const clearAllOrders = useCallback(async (password: string) => {
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
      fetchGlobalCounts();
    } catch (e) {
      // Rollback on failure
      await loadData(page, filters);
      throw e;
    }
  }, [fetchGlobalCounts, loadData, page, filters]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!ordersMap.has(orderId)) return;

    setOrders((prev) => prev.filter((o) => o.id_unique_tracking !== orderId));
    setOrderItems((prev) => prev.filter((item) => item.order_id !== orderId));
    setStatusHistory((prev) => prev.filter((h) => h.order_id !== orderId));

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete order');
      }
      fetchGlobalCounts();
    } catch (e) {
      await loadData(page, filters);
      throw e;
    }
  }, [ordersMap, loadData, fetchGlobalCounts, page, filters]);

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      orderItems,
      statusHistory,
      page,
      totalPages,
      filters,
      setFilters: updateFilters,
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
      isLoading,
      orderItems,
      statusHistory,
      page,
      totalPages,
      filters,
      updateFilters,
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
