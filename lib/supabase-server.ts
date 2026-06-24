import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type CookieMethods = {
  get(name: string): string | undefined
  set(name: string, value: string, options: Record<string, unknown>): void
  remove(name: string, options: Record<string, unknown>): void
}

export function createSupabaseServerClient(cookieMethods: CookieMethods) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseKey) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieMethods.get(name)
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieMethods.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieMethods.remove(name, options)
        },
      },
    }
  )
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  if (!secretKey) throw new Error('Missing environment variable: SUPABASE_SECRET_KEY')

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
