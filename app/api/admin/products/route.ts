import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { productFormSchema } from '@/lib/validators'
import { requireAdmin } from '@/lib/api-auth'
import { verifyAdminPassword } from '@/lib/verify-admin-server'
import { now } from '@/lib/date-utils'
import { TABLES } from '@/lib/db-constants'

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  let body: Record<string, unknown>;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

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
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  let body: Record<string, unknown>;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const password = body.password as string | undefined
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 })
  }

  const email = authResult.email
  if (!email) return NextResponse.json({ error: 'User email not found' }, { status: 500 })
  const pwError = await verifyAdminPassword(supabaseClient, email, password)
  if (pwError) return pwError

  const { error: prodError } = await supabaseClient.from(TABLES.products).delete().neq('id', '')
  if (prodError) {
    return NextResponse.json({ error: prodError.message || 'Failed to clear products' }, { status: 500 })
  }

  const { error: catError } = await supabaseClient.from(TABLES.categories).delete().neq('name', '')
  if (catError) {
    return NextResponse.json({ error: catError.message || 'Failed to clear categories' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
