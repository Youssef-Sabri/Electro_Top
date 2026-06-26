import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { requireAdmin } from '@/lib/api-auth'

export async function GET() {
  const supabase = await getServerSupabase()
  const authResult = await requireAdmin(supabase)
  if (authResult instanceof NextResponse) return authResult
  return NextResponse.json({ verified: true })
}
