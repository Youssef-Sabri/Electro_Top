import { createSupabaseServerClient } from '@/lib/supabase-server';
import { PRODUCT_SELECT_FIELDS, TABLES } from '@/lib/db-constants';
import type { Product, CategoryGroup } from '@/types';

// Server-safe Supabase client for public reads (no auth cookies needed)
function createPublicClient() {
  return createSupabaseServerClient({
    getAll() { return [] },
    setAll() {},
  });
}

export async function fetchCatalog(): Promise<{
  categories: string[];
  products: Product[];
  hierarchy: CategoryGroup[];
}> {
  const supabase = createPublicClient();
  let categories: string[] = [];
  let products: Product[] = [];
  let hierarchy: CategoryGroup[] = [];

  try {
    const [
      { data: catData, error: catError },
      { data: prodData, error: prodError },
    ] = await Promise.all([
      supabase.from(TABLES.categories).select('name, parent_category').order('name'),
      supabase.from(TABLES.products).select(PRODUCT_SELECT_FIELDS).eq('is_active', true).order('created_at'),
    ]);

    if (catData && !catError) {
      categories = catData.map((c: { name: string }) => c.name);
      
      const mainCategories = catData.filter((c: { name: string; parent_category?: string | null }) => !c.parent_category);
      hierarchy = mainCategories.map((main: { name: string }) => ({
        name: main.name,
        icon: 'category',
        subcategories: catData
          .filter((c: { name: string; parent_category?: string | null }) => c.parent_category === main.name)
          .map((c: { name: string }) => c.name),
      }));
    }
    products = prodData && !prodError ? prodData : [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Failed to fetch catalog data:', error);
  }

  return { categories, products, hierarchy };
}
