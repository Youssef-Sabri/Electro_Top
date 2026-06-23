import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { productFormSchema } from '@/lib/validators'

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body;
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
    created_at: new Date().toISOString(),
    ...validation.data
  }

  const { error: insertError } = await supabaseClient.from('products').insert([newProduct])
  if (insertError) {
    return NextResponse.json({ error: insertError.message || 'Failed to add product' }, { status: 500 })
  }

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'add_product',
    details: { product_id: id, product_name: validation.data.name }
  })

  return NextResponse.json({ success: true, product: newProduct })
}

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: prods } = await supabaseClient.from('products').select('id')
  const count = prods?.length || 0

  const { error } = await supabaseClient.from('products').delete().neq('id', '')
  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to clear products' }, { status: 500 })
  }

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'clear_all_products',
    details: { count }
  })

  return NextResponse.json({ success: true })
}
