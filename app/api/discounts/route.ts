import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TABLES, SUBCATEGORY_BANNER_SELECT_FIELDS } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient({
      getAll() { return []; },
      setAll() {},
    });

    const { data, error } = await supabase
      .from(TABLES.subcategoryBanners)
      .select(SUBCATEGORY_BANNER_SELECT_FIELDS)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ banners: [] });
    }

    return NextResponse.json({ banners: data || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({ banners: [] });
  }
}
