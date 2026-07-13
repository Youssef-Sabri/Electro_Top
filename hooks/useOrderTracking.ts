import { useState, useEffect } from 'react';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';
import { normalizeTrackingId, devLog } from '@/lib/utils/misc';

export function useOrderTracking(id: string | null): {
  order: Order | null;
  items: OrderItem[];
  history: OrderStatusHistory[];
  loading: boolean;
  error: string | null;
  cooldown: number;
} {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(() => !!id);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!id) return;
    const trackingId = id;

    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/track/${normalizeTrackingId(trackingId)}`);
        if (res.status === 429) {
          const data = await res.json().catch(() => ({}));
          const cd = data.cooldown || 60;
          setCooldown(cd);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          setItems(data.items);
          setHistory(data.history);
        } else {
          setError('لم يتم العثور على الطلب. تأكد من صحة رقم التتبع.');
        }
      } catch (err) {
        devLog('Failed to fetch order:', err);
        setError('حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  return { order, items, history, loading, error, cooldown };
}
