import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { requireAdminGuard } from '@/lib/auth'
import { productFormSchema } from '@/lib/validations'
import { now } from '@/lib/utils/date'
import { TABLES, STORAGE_BUCKETS } from '@/lib/constants'
import { clearStorageBucket } from '@/lib/utils/file'
import { parseJsonBody } from '@/lib/utils/misc'
import { requirePasswordVerification, revalidateShopPaths } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient } = guard

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

  const validation = productFormSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const id = `p-${crypto.randomUUID()}`
  const newProduct = {
    id,
    created_at: now(),
    ...validation.data
  }

  const { error: insertError } = await supabaseClient.from(TABLES.products).insert([newProduct])
  if (insertError) {
    return NextResponse.json({ error: insertError.message || 'Failed to add product' }, { status: 500 })
  }

  revalidateShopPaths()

  return NextResponse.json({ success: true, product: newProduct })
}

export async function DELETE(request: Request) {
  const result = await requirePasswordVerification(request)
  if (result instanceof NextResponse) return result
  const { supabaseClient } = result

  const clearClient = createSupabaseAdminClient()

  const { error: prodError } = await supabaseClient.from(TABLES.products).delete().neq('id', '')
  if (prodError) {
    return NextResponse.json({ error: prodError.message || 'Failed to clear products' }, { status: 500 })
  }

  const { error: catError } = await supabaseClient.from(TABLES.categories).delete().neq('name', '')
  if (catError) {
    return NextResponse.json({ error: catError.message || 'Failed to clear categories' }, { status: 500 })
  }

  await clearStorageBucket(clearClient, STORAGE_BUCKETS.productImages)

  revalidateShopPaths()

  return NextResponse.json({ success: true })
}
