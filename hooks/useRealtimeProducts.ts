'use client';

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { Product } from '@/types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { TABLES } from '@/lib/constants';

interface UseRealtimeProductsOptions {
  setProducts: Dispatch<SetStateAction<Product[]>>;
  hasFetchedRef: MutableRefObject<boolean>;
  loadData: (force?: boolean) => Promise<void>;
  pathname: string | null;
}

export function useRealtimeProducts({ setProducts, hasFetchedRef, loadData, pathname }: UseRealtimeProductsOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    function subscribe(session: Session) {
      if (channelRef.current || !session) return;

      const channel = supabase
        .channel('products-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: TABLES.products },
          (payload) => {
            const newProduct = payload.new as Product;
            setProducts((prev) => {
              if (prev.some((p) => p.id === newProduct.id)) return prev;
              return [...prev, newProduct];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: TABLES.products },
          (payload) => {
            const updatedProduct = payload.new as Product;
            setProducts((prev) =>
              prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: TABLES.products },
          (payload) => {
            const deletedId = payload.old.id;
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    function unsubscribe() {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }

    const isAdminRoute = pathname?.startsWith('/admin');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && isAdminRoute) {
        await subscribe(session);
      } else {
        unsubscribe();
      }
    });

    if (isAdminRoute) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          hasFetchedRef.current = false;
          loadData(true);
          subscribe(session);
        }
      });
    }

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        if (!isAdminRoute) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          hasFetchedRef.current = false;
          loadData(true);
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
  }, [loadData, pathname, setProducts, hasFetchedRef]);
}
