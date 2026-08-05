'use client';

import { useEffect, useRef, memo } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';

export const CartReconciler = memo(function CartReconciler() {
  const { reconcileCart } = useCart();
  const { getProductsMap, isLoaded, refreshVersion } = useProducts();
  const lastVersionRef = useRef(0);

  useEffect(() => {
    if (!isLoaded) return;
    const map = getProductsMap();
    if (map.size > 0 && refreshVersion !== lastVersionRef.current) {
      reconcileCart(map);
      lastVersionRef.current = refreshVersion;
    }
  }, [isLoaded, refreshVersion, getProductsMap, reconcileCart]);

  return null;
});
CartReconciler.displayName = 'CartReconciler';
