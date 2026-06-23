import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getClientIp } from '@/lib/ip-utils'

const MAX_LOOKUPS = 10
const WINDOW_MS = 60_000
const TRACKING_ID_REGEX = /^ET-[A-Z0-9]{10}$/i

async function checkTrackingRateLimit(supabaseClient: SupabaseClient, ip: string) {
  const { data } = await supabaseClient
    .from('tracking_lookups')
    .select('lookup_count, last_lookup_at')
    .eq('ip_address', ip)
    .single()

  if (!data) return { blocked: false }

  const elapsed = Date.now() - new Date(data.last_lookup_at).getTime()
  if (elapsed > WINDOW_MS) {
    await supabaseClient.from('tracking_lookups').delete().eq('ip_address', ip)
    return { blocked: false }
  }

  if (data.lookup_count >= MAX_LOOKUPS) {
    return { blocked: true, retryAfter: Math.ceil((WINDOW_MS - elapsed) / 1000) }
  }

  return { blocked: false, count: data.lookup_count }
}

async function incrementTrackingLookup(supabaseClient: SupabaseClient, ip: string) {
  const { data } = await supabaseClient
    .from('tracking_lookups')
    .select('lookup_count')
    .eq('ip_address', ip)
    .single()

  const now = new Date().toISOString()

  if (!data) {
    await supabaseClient.from('tracking_lookups').insert({
      ip_address: ip,
      lookup_count: 1,
      first_lookup_at: now,
      last_lookup_at: now,
    })
    return
  }

  await supabaseClient
    .from('tracking_lookups')
    .update({ lookup_count: data.lookup_count + 1, last_lookup_at: now })
    .eq('ip_address', ip)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!TRACKING_ID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid tracking ID format' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const adminClient = createSupabaseAdminClient()

  const rateLimit = await checkTrackingRateLimit(adminClient, ip)
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: 'Too many lookups', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    )
  }

  await incrementTrackingLookup(adminClient, ip)

  const { data, error } = await adminClient.rpc('get_order_details_for_tracking', { tracking_id: id })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Tracking lookup error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث عن الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

