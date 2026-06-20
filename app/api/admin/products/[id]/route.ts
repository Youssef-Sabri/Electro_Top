import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import type { SupabaseClient } from '@supabase/supabase-js'
import { validateRequestOrigin } from '@/lib/csrf'

const ALLOWED_UPDATE_FIELDS = ['name', 'description', 'price', 'stock', 'image_url', 'is_active', 'category'] as const

async function requireAdmin(supabaseClient: SupabaseClient) {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

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

  const supabaseClient = await getServerSupabase()
  const authError = await requireAdmin(supabaseClient)
  if (authError) return authError

  const { error } = await supabaseClient
    .from('products')
    .update(allowed)
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Update product error:', error);
    return NextResponse.json({ error: 'فشل تحديث المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
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
  const authError = await requireAdmin(supabaseClient)
  if (authError) return authError

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete product error:', error);
    return NextResponse.json({ error: 'فشل حذف المنتج. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
