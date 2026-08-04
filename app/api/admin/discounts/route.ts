import { NextResponse } from 'next/server';
import { requireAdminGuard } from '@/lib/auth';
import { subcategoryBannerSchema } from '@/lib/validations';
import { now } from '@/lib/utils/date';
import { TABLES, SUBCATEGORY_BANNER_SELECT_FIELDS } from '@/lib/constants';
import { parseJsonBody } from '@/lib/utils/misc';
import { revalidateShopPaths } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;
  const { supabaseClient } = guard;

  const { data, error } = await supabaseClient
    .from(TABLES.subcategoryBanners)
    .select(SUBCATEGORY_BANNER_SELECT_FIELDS)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch discount banners.' }, { status: 500 });
  }

  return NextResponse.json({ banners: data || [] });
}

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;
  const { supabaseClient } = guard;

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (body instanceof NextResponse) return body;

  const validation = subcategoryBannerSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const id = `banner-${crypto.randomUUID()}`;
  const timestamp = now();

  const newBanner = {
    id,
    subcategory_name: validation.data.subcategory_name,
    title: validation.data.title,
    subtitle: validation.data.subtitle || null,
    discount_percentage: validation.data.discount_percentage ?? null,
    discount_badge: validation.data.discount_badge || null,
    banner_color: validation.data.banner_color || 'gradient-primary',
    image_url: validation.data.image_url || null,
    is_active: validation.data.is_active,
    start_date: validation.data.start_date || null,
    end_date: validation.data.end_date || null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const { error: insertError } = await supabaseClient
    .from(TABLES.subcategoryBanners)
    .insert([newBanner]);

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create discount banner.' }, { status: 500 });
  }

  revalidateShopPaths();

  return NextResponse.json({ success: true, banner: newBanner });
}
