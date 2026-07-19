import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PRODUCT_SELECT_FIELDS, TABLES } from '@/lib/constants';
import type { Product, CategoryGroup } from '@/types';

// Server-safe Supabase client for public reads (no auth cookies needed)
function createPublicClient() {
  return createSupabaseServerClient({
    getAll() { return []; },
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
      supabase.from(TABLES.products).select(PRODUCT_SELECT_FIELDS).eq('is_active', true).order('sort_order', { ascending: true }),
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

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();

  try {
    // 1. Try exact slug match
    const { data, error } = await supabase
      .from(TABLES.products)
      .select(PRODUCT_SELECT_FIELDS)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (data && !error) return data;

    // 2. Decode URL slug if encoded
    const decodedSlug = decodeURIComponent(slug);
    if (decodedSlug !== slug) {
      const { data: decodedData, error: decodedError } = await supabase
        .from(TABLES.products)
        .select(PRODUCT_SELECT_FIELDS)
        .eq('slug', decodedSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (decodedData && !decodedError) return decodedData;
    }

    // 3. Fallback: extract UUID from end of slug (e.g. 33d99e7d-de24-46ff-a688-9c5c71b13c47)
    const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (uuidMatch) {
      const fullId = `p-${uuidMatch[1]}`;
      const { data: idData, error: idError } = await supabase
        .from(TABLES.products)
        .select(PRODUCT_SELECT_FIELDS)
        .eq('id', fullId)
        .eq('is_active', true)
        .maybeSingle();

      if (idData && !idError) return idData;
    }

    // 4. Fallback: match by product ID directly
    const directIdMatch = slug.match(/(p-[a-z0-9-]+)$/i);
    if (directIdMatch) {
      const { data: directData, error: directError } = await supabase
        .from(TABLES.products)
        .select(PRODUCT_SELECT_FIELDS)
        .eq('id', directIdMatch[1])
        .eq('is_active', true)
        .maybeSingle();

      if (directData && !directError) return directData;
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createPublicClient();

  try {
    const { data, error } = await supabase
      .from(TABLES.products)
      .select('slug, updated_at, created_at')
      .eq('is_active', true);

    if (error || !data) return [];
    return data
      .filter((p: { slug: string | null }) => p.slug && p.slug.trim() !== '')
      .map((p: { slug: string; updated_at?: string | null; created_at: string }) => ({
        slug: p.slug,
        updated_at: p.updated_at || p.created_at,
      }));
  } catch {
    return [];
  }
}
