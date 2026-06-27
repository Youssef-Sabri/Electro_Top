import { useState, useEffect } from 'react';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';
import { normalizeTrackingId } from '@/lib/constants';
import { devLog } from '@/lib/dev-log';

export function useOrderTracking(id: string | null): {
  order: Order | null;
  items: OrderItem[];
  history: OrderStatusHistory[];
  loading: boolean;
} {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(() => !!id);

  useEffect(() => {
    if (!id) return;
    const trackingId = id;

    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/track/${normalizeTrackingId(trackingId)}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          setItems(data.items);
          setHistory(data.history);
        }
      } catch (error) {
        devLog('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  return { order, items, history, loading };
}
