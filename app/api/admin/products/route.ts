import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdminGuard } from '@/lib/admin-guard'
import { productFormSchema } from '@/lib/validators'
import { verifyAdminPassword } from '@/lib/verify-admin-server'
import { now } from '@/lib/date-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'
import { clearStorageBucket } from '@/lib/file-utils'
import { parseJsonBody } from '@/lib/parse-json'

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

  return NextResponse.json({ success: true, product: newProduct })
}

export async function DELETE(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient, user } = guard

  const body = await parseJsonBody<{ password?: string }>(request)
  if (body instanceof NextResponse) return body

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = user.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

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

  return NextResponse.json({ success: true })
}
