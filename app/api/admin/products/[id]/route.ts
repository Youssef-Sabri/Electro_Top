import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { productFormSchema } from '@/lib/validators'
import { requireAdmin } from '@/lib/api-auth'
import { extractFileName } from '@/lib/file-utils'

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'price', 'stock', 'image_url', 'is_active', 'category'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

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
      .from('products')
      .select('image_url')
      .eq('id', id)
      .maybeSingle()
    if (!fetchError && oldProduct) {
      oldImageUrl = oldProduct.image_url
    }
  }

  const { error } = await supabaseClient
    .from('products')
    .update(validation.data)
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Update product error:', error);
    return NextResponse.json({ error: 'فشل تحديث المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // Delete old image if new image was successfully updated in DB
  if (oldImageUrl && oldImageUrl !== validation.data.image_url) {
    const fileName = oldImageUrl.includes('/')
      ? extractFileName(oldImageUrl)
      : oldImageUrl;
    if (fileName) {
      const adminClient = createSupabaseAdminClient()
      await adminClient.storage.from('product-images').remove([fileName])
    }
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
    .from('products')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    if (process.env.NODE_ENV !== 'production') console.error('Fetch product before delete error:', fetchError);
    return NextResponse.json({ error: 'فشل استرداد بيانات المنتج قبل الحذف.' }, { status: 500 })
  }

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete product error:', error);
    return NextResponse.json({ error: 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  // Delete product image from storage server-side
  if (productData?.image_url) {
    const fileName = productData.image_url.includes('/')
      ? extractFileName(productData.image_url)
      : productData.image_url;
    if (fileName) {
      const adminClient = createSupabaseAdminClient()
      await adminClient.storage.from('product-images').remove([fileName])
    }
  }

  return NextResponse.json({ success: true })
}
