import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PRODUCT_SELECT_FIELDS, TABLES } from '@/lib/db-constants';
import type { Product } from '@/types';

// Server-safe Supabase client for public reads (no auth cookies needed)
function createPublicClient() {
  return createSupabaseServerClient({
    get() { return undefined },
    set() {},
    remove() {},
  });
}

export async function fetchCatalog(): Promise<{ categories: string[]; products: Product[] }> {
  const supabase = createPublicClient();
  let categories: string[] = [];
  let products: Product[] = [];

  try {
    const [
      { data: catData, error: catError },
      { data: prodData, error: prodError },
    ] = await Promise.all([
      supabase.from(TABLES.categories).select('name').order('name'),
      supabase.from(TABLES.products).select(PRODUCT_SELECT_FIELDS).eq('is_active', true).order('created_at'),
    ]);

    categories = catData && !catError ? catData.map((c: { name: string }) => c.name) : [];
    products = prodData && !prodError ? prodData : [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch catalog data:', error);
  }

  return { categories, products };
}
