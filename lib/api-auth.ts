import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_ROLE = 'admin' as const

export function isAdminRole(role: unknown): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE
}

export async function requireAdmin(supabaseClient: SupabaseClient) {
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user || !isAdminRole(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}
