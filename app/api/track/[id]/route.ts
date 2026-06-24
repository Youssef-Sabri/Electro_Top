import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getClientIp } from '@/lib/ip-utils'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import type { RateLimitConfig } from '@/lib/rate-limit'

const TRACKING_RATE_LIMIT: RateLimitConfig = {
  table: 'tracking_lookups',
  countColumn: 'lookup_count',
  lastColumn: 'last_lookup_at',
  firstColumn: 'first_lookup_at',
  maxAttempts: 10,
  windowMs: 60_000,
}
const TRACKING_ID_REGEX = /^ET-[A-Z0-9]{10}$/i

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

  const rateLimit = await checkRateLimit(adminClient, ip, TRACKING_RATE_LIMIT)
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: 'Too many lookups', retryAfter: rateLimit.cooldown },
      { status: 429, headers: { 'Retry-After': String(rateLimit.cooldown) } }
    )
  }

  await incrementRateLimit(adminClient, ip, TRACKING_RATE_LIMIT)

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

