import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { z } from 'zod'
import { requireAdmin } from '@/lib/api-auth'
import { TABLES } from '@/lib/db-constants'

const categorySchema = z.string().min(1, 'اسم الفئة مطلوب').max(50, 'اسم الفئة يجب ألا يتجاوز 50 حرفاً')

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  let body;
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = categorySchema.safeParse(body.name)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0]?.message || 'Validation failed' }, { status: 400 })
  }

  const trimmedName = validation.data.trim()

  const { error: insertError } = await supabaseClient
    .from(TABLES.categories)
    .insert([{ name: trimmedName }])

  if (insertError) {
    if (process.env.NODE_ENV !== 'production') console.error('Add category error:', insertError)
    return NextResponse.json({ error: 'فشل إضافة الفئة. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, name: trimmedName })
}

export async function DELETE(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const trimmedName = name.trim()

  const { error: deleteError } = await supabaseClient
    .from(TABLES.categories)
    .delete()
    .eq('name', trimmedName)

  if (deleteError) {
    if (process.env.NODE_ENV !== 'production') console.error('Delete category error:', deleteError)
    return NextResponse.json({ error: 'فشل حذف الفئة. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
