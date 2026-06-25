import { useState, useEffect } from 'react';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';

export function useOrderTracking(id: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(() => !!id);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/track/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          setItems(data.items);
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  return { order, items, history, loading };
}
