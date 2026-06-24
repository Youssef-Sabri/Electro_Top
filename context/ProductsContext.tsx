'use client';

import { createContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { z } from 'zod';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';

import { PRODUCT_SELECT_FIELDS } from '@/lib/db-constants';
import { deleteProductImage, clearAllProductImages } from '@/lib/image-utils';

const categorySchema = z.string().min(1, 'اسم الفئة مطلوب').max(50, 'اسم الفئة يجب ألا يتجاوز 50 حرفاً');

export interface ProductsContextType {
  products: Product[];
  categories: string[];
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsMap: () => Map<string, Product>;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  clearAllProducts: (password: string) => Promise<void>;
  initializeData: (products: Product[], categories: string[]) => void;
  refreshProducts: () => Promise<void>;
  isLoaded: boolean;
  refreshVersion: number;
}

export const ProductsContext = createContext<ProductsContextType | undefined>(undefined);


export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const productsMapRef = useRef<Map<string, Product>>(new Map());
  const productsRef = useRef<Product[]>([]);
  const categoriesRef = useRef<string[]>([]);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    productsMapRef.current = map;
    productsRef.current = products;
    categoriesRef.current = categories;
  }, [products, categories]);

  const loadData = useCallback(async (force = false) => {
    if (isFetchingRef.current || (!force && hasFetchedRef.current)) return;
    isFetchingRef.current = true;
    try {
      const [
        { data: catData, error: catError },
        { data: prodData, error: prodError },
      ] = await Promise.all([
        supabase.from('categories').select('name').order('name'),
        supabase.from('products').select(PRODUCT_SELECT_FIELDS).order('created_at'),
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
      if (process.env.NODE_ENV !== 'production') console.error('Failed to load products/categories from Supabase:', error);
      setIsLoaded(true);
      hasFetchedRef.current = true;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    loadData();
  }, [loadData]);

  useEffect(() => {
    const POLLING_INTERVAL = 60_000;

    const poll = () => loadData(true);

    const intervalId = setInterval(poll, POLLING_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribeIfAdmin() {
      if (channel) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel('products-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            hasFetchedRef.current = false;
            loadData(true);
          }
        )
        .subscribe();
    }

    function unsubscribe() {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    }

    subscribeIfAdmin();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        subscribeIfAdmin();
        hasFetchedRef.current = false;
        loadData(true);
      } else {
        unsubscribe();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [loadData]);

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
      setProducts((prev) => [...prev, product]);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to add product:', e);
      throw e;
    }
  }, []);

  const updateProduct = useCallback(async (updated: Product) => {
    const oldProduct = productsMapRef.current.get(updated.id);
    if (!oldProduct) return;
    const hasImageChanged = oldProduct.image_url !== updated.image_url;

    const originalProducts = productsRef.current;

    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    try {
      const response = await fetch(`/api/admin/products/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!response.ok) {
        setProducts(originalProducts);
        const data = await response.json();
        throw new Error(data.error || 'فشل تحديث المنتج. يرجى المحاولة مرة أخرى.');
      }

      if (hasImageChanged) {
        await deleteProductImage(oldProduct.image_url);
      }
    } catch (e) {
      setProducts(originalProducts);
      throw e;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const oldProduct = productsMapRef.current.get(id);
    if (!oldProduct) return;

    const originalProducts = productsRef.current;

    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        setProducts(originalProducts);
        const data = await response.json();
        throw new Error(data.error || 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.');
      }

      await deleteProductImage(oldProduct.image_url);
    } catch (e) {
      setProducts(originalProducts);
      throw e;
    }
  }, []);

  const getProductById = useCallback((id: string) => {
    return productsMapRef.current.get(id);
  }, []);

  const getProductsMap = useCallback(() => {
    return productsMapRef.current;
  }, []);

  const addCategory = useCallback(async (newCat: string) => {
    const result = categorySchema.safeParse(newCat.trim());
    if (!result.success) {
      if (process.env.NODE_ENV !== 'production') console.error('Invalid category name:', result.error.issues);
      return;
    }
    const trimmed = result.data;

    setCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        setCategories((prev) => prev.filter((c) => c !== trimmed));
      }
    } catch {
      setCategories((prev) => prev.filter((c) => c !== trimmed));
    }
  }, []);

  const deleteCategory = useCallback(async (catToDelete: string) => {
    const trimmed = catToDelete.trim();
    if (!trimmed) return;

    const currentCategories = categoriesRef.current;
    const currentProducts = productsRef.current;

    const oldCategories = currentCategories;
    const oldProducts = currentProducts;

    const newCategories = currentCategories.filter((c) => c !== trimmed);
    const fallbackCat = newCategories[0] ?? null;
    const newProducts = currentProducts.map((p) =>
      p.category === trimmed ? { ...p, category: fallbackCat } : p
    );

    setCategories(newCategories);
    setProducts(newProducts);

    try {
      const response = await fetch(`/api/admin/categories?name=${encodeURIComponent(trimmed)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setCategories(oldCategories);
        setProducts(oldProducts);
      }
    } catch {
      setCategories(oldCategories);
      setProducts(oldProducts);
    }
  }, []);

  const clearAllProducts = useCallback(async (password: string) => {
    const previousProducts = productsRef.current;
    const previousCategories = categoriesRef.current;
    setProducts([]);
    setCategories([]);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setProducts(previousProducts);
        setCategories(previousCategories);
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear products');
      }
      await clearAllProductImages();
    } catch (e) {
      setProducts(previousProducts);
      setCategories(previousCategories);
      if (process.env.NODE_ENV !== 'production') console.error(e);
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
      addCategory,
      deleteCategory,
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
      addCategory,
      deleteCategory,
      clearAllProducts,
      initializeData,
      refreshProducts,
      isLoaded,
      refreshVersion,
    ]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}
