import { createServerClient } from '@supabase/ssr'

type CookieMethods = {
  get(name: string): string | undefined
  set(name: string, value: string, options: Record<string, unknown>): void
  remove(name: string, options: Record<string, unknown>): void
}

export function createSupabaseServerClient(cookieMethods: CookieMethods) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
