'use client';

import { ReactNode, Suspense, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Synchronizes cart items with latest product data when products change in DB.
// Removes deleted/inactive items, updates prices, and clamps quantities to stock.
function CartReconciler() {
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
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="h-16 w-full bg-surface" />}>
        <Navbar />
      </Suspense>
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartReconciler />
    </div>
  );
}
