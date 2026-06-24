import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function requireAdmin(supabaseClient: SupabaseClient) {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}
