export function getSupabaseHostname(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  try {
    return new URL(supabaseUrl).hostname
  } catch {
    return '*.supabase.co'
  }
}
