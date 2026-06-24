import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function verifyAdminPassword(supabaseClient: SupabaseClient, email: string, password: string) {
  const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 })
  }
}
