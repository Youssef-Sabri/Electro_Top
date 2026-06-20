'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { CartItem, Product } from '@/types';

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  reconcileCart: (productsById: Map<string, Product>) => void;
  total: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'electro-top-cart';

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return [];
    }
    const validated: CartItem[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        const productObj = itemObj.product as Record<string, unknown> | undefined;
        const quantityNum = typeof itemObj.quantity === 'number' ? itemObj.quantity : 1;

        if (productObj && typeof productObj.id === 'string' && typeof productObj.price === 'number') {
          validated.push({
            product: {
              id: productObj.id,
              name: (productObj.name as string) || 'Unnamed Product',
              description: (productObj.description as string) || '',
              price: productObj.price,
              image_url: (productObj.image_url as string) || '',
              stock: typeof productObj.stock === 'number' ? productObj.stock : 10,
              is_active: productObj.is_active !== false,
              category: (productObj.category as string) || 'General',
              created_at: (productObj.created_at as string) || new Date().toISOString(),
            },
            quantity: quantityNum,
          });
        }
      }
    }
    return validated;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setItems(loadCartFromStorage()); setIsHydrated(true); }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
       } catch {
       }
    }, 300);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [items, isHydrated]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (product.stock <= 0) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const existingItem = prevItems[existingIndex];
        const newQuantity = existingItem.quantity + quantity;
        const clampedQuantity = Math.min(newQuantity, product.stock);

        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...existingItem,
          quantity: clampedQuantity,
        };
        return updatedItems;
      } else {
        const clampedQuantity = Math.min(quantity, product.stock);
        return [...prevItems, { product, quantity: clampedQuantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          const clampedQuantity = Math.min(quantity, item.product.stock);
          return { ...item, quantity: clampedQuantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const reconcileCart = useCallback((productsById: Map<string, Product>) => {
    setItems((prevItems) => {
      let changed = false;
      const next = prevItems.filter((item) => {
        const current = productsById.get(item.product.id);
        if (!current || !current.is_active) {
          changed = true;
          return false;
        }
        return true;
      });
      const reconciled = next.map((item) => {
        const current = productsById.get(item.product.id)!;
        if (
          item.product.price !== current.price ||
          item.product.stock !== current.stock ||
          item.product.name !== current.name ||
          item.product.image_url !== current.image_url
        ) {
          changed = true;
          return { ...item, product: current, quantity: Math.min(item.quantity, current.stock) };
        }
        return item;
      });
      return changed ? reconciled : prevItems;
    });
  }, []);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, reconcileCart, total, itemCount }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart, reconcileCart, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
