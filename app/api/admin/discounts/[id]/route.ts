import { NextResponse } from 'next/server';
import { requireAdminGuard } from '@/lib/auth';
import { subcategoryBannerSchema } from '@/lib/validations';
import { now } from '@/lib/utils/date';
import { TABLES } from '@/lib/constants';
import { parseJsonBody } from '@/lib/utils/misc';
import { requirePasswordVerification, revalidateShopPaths } from '@/lib/api-helpers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminGuard(request);
  if (guard instanceof NextResponse) return guard;
  const { supabaseClient } = guard;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (body instanceof NextResponse) return body;

  // Handle quick is_active toggle payload or full schema update
  if (Object.keys(body).length === 1 && typeof body.is_active === 'boolean') {
    const { error: toggleError } = await supabaseClient
      .from(TABLES.subcategoryBanners)
      .update({ is_active: body.is_active, updated_at: now() })
      .eq('id', id);

    if (toggleError) {
      return NextResponse.json({ error: 'Failed to update banner status.' }, { status: 500 });
    }

    revalidateShopPaths();
    return NextResponse.json({ success: true });
  }

  const validation = subcategoryBannerSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updatedBanner = {
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
    updated_at: now(),
  };

  const { error: updateError } = await supabaseClient
    .from(TABLES.subcategoryBanners)
    .update(updatedBanner)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update discount banner.' }, { status: 500 });
  }

  revalidateShopPaths();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requirePasswordVerification(request);
  if (result instanceof NextResponse) return result;
  const { supabaseClient } = result;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
  }

  const { error: deleteError } = await supabaseClient
    .from(TABLES.subcategoryBanners)
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete discount banner.' }, { status: 500 });
  }

  revalidateShopPaths();

  return NextResponse.json({ success: true });
}
