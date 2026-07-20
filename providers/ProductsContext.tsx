'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { TABLES, PRODUCT_SELECT_FIELDS } from '@/lib/constants';
import { devLog } from '@/lib/utils/misc';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';

export interface ProductsContextType {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsMap: () => ReadonlyMap<string, Product>;
  clearAllProducts: (password: string) => Promise<void>;
  initializeData: (products: Product[], categories: string[]) => void;
  refreshProducts: () => Promise<void>;
  isLoaded: boolean;
  refreshVersion: number;
}

export const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const loadData = useCallback(async (force = false) => {
    if (isFetchingRef.current || (!force && hasFetchedRef.current)) return;
    isFetchingRef.current = true;
    try {
      const [
        { data: catData, error: catError },
        { data: prodData, error: prodError },
      ] = await Promise.all([
        supabase.from(TABLES.categories).select('name').order('name'),
        supabase.from(TABLES.products).select(PRODUCT_SELECT_FIELDS).order('sort_order', { ascending: true }),
      ]);

      if (!catError && catData) {
        setCategories(catData.map((c: { name: string }) => c.name));
      }
      if (!prodError && prodData) {
        setProducts(prodData);
      }
      setIsLoaded(true);
      hasFetchedRef.current = true;
      setRefreshVersion((v) => v + 1);
    } catch (error) {
      devLog('Failed to load products/categories from Supabase:', error);
      setIsLoaded(true);
      hasFetchedRef.current = true;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/shop')) return;
    if (hasFetchedRef.current) return;
    loadData();
  }, [loadData, pathname]);

  useRealtimeProducts({ setProducts, hasFetchedRef, loadData, pathname });

  const refreshProducts = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const initializeData = useCallback((initialProds: Product[], initialCats: string[]) => {
    setProducts(initialProds);
    setCategories(initialCats);
    setIsLoaded(true);
    setRefreshVersion((v) => v + 1);
    hasFetchedRef.current = true;
  }, []);

  const addProduct = useCallback(async (newProductData: Omit<Product, 'id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل إضافة المنتج. يرجى المحاولة مرة أخرى.');
      }

      const resData = await response.json();
      const product = resData.product;
      setProducts((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        return [...prev, product];
      });
    } catch (e) {
      devLog('Failed to add product:', e);
      throw e;
    }
  }, []);

  const updateProduct = useCallback(async (updated: Product) => {
    let rollbackProduct: Product | undefined;
    setProducts((prev) => {
      rollbackProduct = prev.find((p) => p.id === updated.id);
      return prev.map((p) => (p.id === updated.id ? updated : p));
    });

    try {
      const response = await fetch(`/api/admin/products/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        if (rollbackProduct) {
          setProducts((prev) => prev.map((p) => (p.id === rollbackProduct!.id ? rollbackProduct! : p)));
        }
        const data = await response.json();
        throw new Error(data.error || 'فشل تحديث المنتج. يرجى المحاولة مرة أخرى.');
      }
    } catch (e) {
      if (rollbackProduct) {
        setProducts((prev) => prev.map((p) => (p.id === rollbackProduct!.id ? rollbackProduct! : p)));
      }
      throw e;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    let rollbackProduct: Product | undefined;
    setProducts((prev) => {
      rollbackProduct = prev.find((p) => p.id === id);
      return prev.filter((p) => p.id !== id);
    });

    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        if (rollbackProduct) {
          setProducts((prev) => {
            if (prev.some((p) => p.id === rollbackProduct!.id)) return prev;
            return [...prev, rollbackProduct!];
          });
        }
        const data = await response.json();
        throw new Error(data.error || 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.');
      }
    } catch (e) {
      if (rollbackProduct) {
        setProducts((prev) => {
          if (prev.some((p) => p.id === rollbackProduct!.id)) return prev;
          return [...prev, rollbackProduct!];
        });
      }
      throw e;
    }
  }, []);

  const getProductById = useCallback((id: string) => {
    return productsMap.get(id);
  }, [productsMap]);

  const getProductsMap = useCallback(() => {
    return new Map(productsMap) as ReadonlyMap<string, Product>;
  }, [productsMap]);

  const clearAllProducts = useCallback(async (password: string) => {
    let rollbackProducts: Product[] = [];
    let rollbackCategories: string[] = [];
    setProducts((prev) => { rollbackProducts = prev; return []; });
    setCategories((prev) => { rollbackCategories = prev; return []; });

    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setProducts(rollbackProducts);
        setCategories(rollbackCategories);
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear products');
      }
    } catch (e) {
      setProducts(rollbackProducts);
      setCategories(rollbackCategories);
      devLog(e);
      throw e;
    }
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      getProductsMap,
      clearAllProducts,
      initializeData,
      refreshProducts,
      isLoaded,
      refreshVersion,
    }),
    [
      products,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      getProductsMap,
      clearAllProducts,
      initializeData,
      refreshProducts,
      isLoaded,
      refreshVersion,
    ]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}
