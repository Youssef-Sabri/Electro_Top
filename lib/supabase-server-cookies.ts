import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'

interface CookieOptions {
  name?: string
  value?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none' | boolean
  path?: string
  maxAge?: number
  domain?: string
  expires?: Date
}

export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      cookieStore.set(name, value, options as Partial<CookieOptions>)
    },
    remove(name: string, options: Record<string, unknown>) {
      cookieStore.set(name, '', { ...options, maxAge: -1 } as Partial<CookieOptions>)
    },
  })
}
