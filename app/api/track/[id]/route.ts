import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getClientIp } from '@/lib/ip-utils'
import { checkAndIncrementRateLimit } from '@/lib/rate-limit'
import { RATE_LIMIT_CONFIGS } from '@/lib/db-constants'

const TRACKING_RATE_LIMIT = RATE_LIMIT_CONFIGS.tracking;
const TRACKING_ID_REGEX = /^ET-[A-Z0-9]{10}$/i

function maskName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  return parts
    .map((part) => {
      if (part.length <= 1) return part
      if (part.length === 2) return part[0] + '*'
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
    })
    .join(' ')
}

function maskPhone(phone: string): string {
  if (!phone) return ''
  const clean = phone.trim()
  if (clean.length < 7) return '*'.repeat(clean.length)
  const first = clean.substring(0, 3)
  const last = clean.substring(clean.length - 4)
  const middleLen = clean.length - 7
  return `${first}${'*'.repeat(middleLen > 0 ? middleLen : 4)}${last}`
}

function maskAddress(address: string): string {
  if (!address) return ''
  const clean = address.trim()
  if (clean.length <= 8) return '***'
  return clean.substring(0, 8) + '...'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const uppercaseId = id.toUpperCase()

  if (!TRACKING_ID_REGEX.test(uppercaseId)) {
    return NextResponse.json({ error: 'Invalid tracking ID format' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const adminClient = createSupabaseAdminClient()

  const rateLimit = await checkAndIncrementRateLimit(adminClient, ip, TRACKING_RATE_LIMIT)
  if (rateLimit.blocked) {
    return NextResponse.json(
      { error: 'Too many lookups', retryAfter: rateLimit.cooldown },
      { status: 429, headers: { 'Retry-After': String(rateLimit.cooldown) } }
    )
  }

  const { data, error } = await adminClient.rpc('get_order_details_for_tracking', { tracking_id: uppercaseId })

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Tracking lookup error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث عن الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  if (!data || !data.order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Mask PII fields to preserve customer privacy
  const order = { ...data.order }
  if (order.customer_name) {
    order.customer_name = maskName(order.customer_name)
  }
  if (order.phone_number) {
    order.phone_number = maskPhone(order.phone_number)
  }
  if (order.shipping_address) {
    order.shipping_address = maskAddress(order.shipping_address)
  }
  if (order.instapay_phone_number) {
    order.instapay_phone_number = maskPhone(order.instapay_phone_number)
  }
  if (order.location_link) {
    order.location_link = ''
  }

  return NextResponse.json({
    ...data,
    order
  })
}

