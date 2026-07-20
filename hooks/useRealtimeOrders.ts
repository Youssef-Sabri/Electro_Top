'use client';

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Order, OrderItem, OrderStatusHistory } from '@/types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { TABLES } from '@/lib/constants';

interface UseRealtimeOrdersOptions {
  setOrders: Dispatch<SetStateAction<Order[]>>;
  setOrderItems: Dispatch<SetStateAction<OrderItem[]>>;
  setStatusHistory: Dispatch<SetStateAction<OrderStatusHistory[]>>;
  pathname: string | null;
}

export function useRealtimeOrders({ setOrders, setOrderItems, setStatusHistory, pathname }: UseRealtimeOrdersOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    function subscribe(session: Session) {
      if (channelRef.current || !session) return;

      const channel = supabase
        .channel('orders-realtime')
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
        );

      channelRef.current = channel;
      channel.subscribe();
    }

    function unsubscribe() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }

    const isAdminRoute = pathname?.startsWith('/admin');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && isAdminRoute) {
        await subscribe(session);
      } else if (event === 'SIGNED_OUT') {
        unsubscribe();
        setOrders([]);
        setOrderItems([]);
        setStatusHistory([]);
      } else {
        unsubscribe();
      }
    });

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        if (!isAdminRoute) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await subscribe(session);
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
  }, [pathname, setOrders, setOrderItems, setStatusHistory]);
}
