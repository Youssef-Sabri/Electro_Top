import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Only the properties Next.js actually uses (name/value are passed separately)
interface SafeCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none' | boolean;
  path?: string;
  maxAge?: number;
  domain?: string;
  expires?: Date;
}

function sanitizeOptions(raw: Record<string, unknown>): SafeCookieOptions {
  const ok = new Set<string>(['httpOnly', 'secure', 'sameSite', 'path', 'maxAge', 'domain', 'expires'])
  const out: SafeCookieOptions = {}
  for (const [k, v] of Object.entries(raw)) {
    if (ok.has(k)) (out as Record<string, unknown>)[k] = v
  }
  return out
}

export async function getServerSupabase() {
  const cookieStore = await cookies()
  return createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      cookieStore.set(name, value, sanitizeOptions(options))
    },
    remove(name: string, options: Record<string, unknown>) {
      cookieStore.set(name, '', { ...sanitizeOptions(options), maxAge: -1 })
    },
  })
}
