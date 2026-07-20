import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PRODUCT_SELECT_FIELDS, TABLES } from '@/lib/constants';
import type { Product, CategoryGroup } from '@/types';
import { devLog } from '@/lib/utils/misc';

// Server-safe Supabase client for public reads (no auth cookies needed)
// Reuse a single client instance across calls within the same request
let cachedClient: ReturnType<typeof createSupabaseServerClient> | null = null;

function getPublicClient() {
  if (!cachedClient) {
    cachedClient = createSupabaseServerClient({
      getAll() { return []; },
      setAll() {},
    });
  }
  return cachedClient;
}

export async function fetchCatalog(): Promise<{
  categories: string[];
  products: Product[];
  hierarchy: CategoryGroup[];
}> {
  const supabase = getPublicClient();
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
    devLog('Failed to fetch catalog data:', error);
  }

  return { categories, products, hierarchy };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getPublicClient();

  try {
    // Build all possible identifiers to match in a single query
    const decodedSlug = decodeURIComponent(slug);
    const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    const directIdMatch = slug.match(/(p-[a-z0-9-]+)$/i);

    // Single query with OR filter covering all fallbacks
    const orParts = [`slug.eq.${slug}`];
    if (decodedSlug !== slug) orParts.push(`slug.eq.${decodedSlug}`);
    if (uuidMatch) orParts.push(`id.eq.p-${uuidMatch[1]}`);
    if (directIdMatch) orParts.push(`id.eq.${directIdMatch[1]}`);

    const { data, error } = await supabase
      .from(TABLES.products)
      .select(PRODUCT_SELECT_FIELDS)
      .eq('is_active', true)
      .or(orParts.join(','))
      .limit(1)
      .maybeSingle();

    if (data && !error) return data;

    return null;
  } catch (error) {
    devLog('Failed to fetch product by slug:', error);
    return null;
  }
}

export async function fetchAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = getPublicClient();

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
