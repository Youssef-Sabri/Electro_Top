import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { productFormPartialSchema } from '@/lib/validators'
import { deleteStorageFile } from '@/lib/file-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'price', 'stock', 'image_url', 'image_url_2', 'image_url_3', 'is_active', 'category', 'has_colors', 'colors'] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient } = guard

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
  const validation = productFormPartialSchema.safeParse(allowed)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  // Fetch product data first to retrieve old image URLs if any image fields are in the update
  const imageKeysToCheck = ['image_url', 'image_url_2', 'image_url_3'] as const
  const oldImageUrls: Record<string, string | null> = { image_url: null, image_url_2: null, image_url_3: null }
  const hasImageFieldInBody = imageKeysToCheck.some((k) => k in validation.data)

  if (hasImageFieldInBody) {
    const { data: oldProduct, error: fetchError } = await supabaseClient
      .from(TABLES.products)
      .select('image_url, image_url_2, image_url_3')
      .eq('id', id)
      .maybeSingle()
    if (!fetchError && oldProduct) {
      oldImageUrls.image_url = oldProduct.image_url
      oldImageUrls.image_url_2 = oldProduct.image_url_2
      oldImageUrls.image_url_3 = oldProduct.image_url_3
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

  if (hasImageFieldInBody) {
    const adminClient = createSupabaseAdminClient()
    for (const key of imageKeysToCheck) {
      const oldVal = oldImageUrls[key]
      const newVal = validation.data[key]
      if (key in validation.data && oldVal && oldVal !== newVal) {
        await deleteStorageFile(adminClient, STORAGE_BUCKETS.productImages, oldVal)
      }
    }
  }

  revalidatePath('/')
  revalidatePath('/shop')

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient } = guard

  const { id } = await params

  // Fetch product data first to retrieve image URLs
  const { data: productData, error: fetchError } = await supabaseClient
    .from(TABLES.products)
    .select('image_url, image_url_2, image_url_3')
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

  if (productData) {
    const adminClient = createSupabaseAdminClient()
    const urlsToDelete = [productData.image_url, productData.image_url_2, productData.image_url_3].filter(Boolean) as string[]
    for (const url of urlsToDelete) {
      await deleteStorageFile(adminClient, STORAGE_BUCKETS.productImages, url)
    }
  }

  revalidatePath('/')
  revalidatePath('/shop')

  return NextResponse.json({ success: true })
}
