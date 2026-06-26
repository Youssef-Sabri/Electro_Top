import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { productFormSchema } from '@/lib/validators'
import { requireAdmin } from '@/lib/api-auth'
import { deleteStorageFile } from '@/lib/file-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'price', 'stock', 'image_url', 'is_active', 'category'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

  const allowed: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) {
      allowed[key] = body[key]
    }
  }

  // Parse and validate PATCH data against partial productFormSchema
  const validation = productFormSchema.partial().safeParse(allowed)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const supabaseClient = await getServerSupabase()
  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  // Fetch product data first to retrieve old image_url if image_url is in the update fields
  let oldImageUrl: string | null = null
  if ('image_url' in validation.data && validation.data.image_url) {
    const { data: oldProduct, error: fetchError } = await supabaseClient
      .from(TABLES.products)
      .select('image_url')
      .eq('id', id)
      .maybeSingle()
    if (!fetchError && oldProduct) {
      oldImageUrl = oldProduct.image_url
    }
  }

  const { error } = await supabaseClient
    .from(TABLES.products)
    .update(validation.data)
    .eq('id', id)

  if (error) {
    devLog('Update product error:', error);
    return NextResponse.json({ error: 'فشل تحديث المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  if (oldImageUrl && oldImageUrl !== validation.data.image_url) {
    const adminClient = createSupabaseAdminClient()
    await deleteStorageFile(adminClient, STORAGE_BUCKETS.productImages, oldImageUrl)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const supabaseClient = await getServerSupabase()
  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  // Fetch product data first to retrieve image_url
  const { data: productData, error: fetchError } = await supabaseClient
    .from(TABLES.products)
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    devLog('Fetch product before delete error:', fetchError);
    return NextResponse.json({ error: 'فشل استرداد بيانات المنتج قبل الحذف.' }, { status: 500 })
  }

  const { error } = await supabaseClient
    .from(TABLES.products)
    .delete()
    .eq('id', id)

  if (error) {
    devLog('Delete product error:', error);
    return NextResponse.json({ error: 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  if (productData?.image_url) {
    const adminClient = createSupabaseAdminClient()
    await deleteStorageFile(adminClient, STORAGE_BUCKETS.productImages, productData.image_url)
  }

  return NextResponse.json({ success: true })
}
