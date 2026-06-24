import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { checkoutSchema } from '@/lib/validators'
import { generateOrderId } from '@/lib/id-generator'
import { getClientIp } from '@/lib/ip-utils'
import { checkAndIncrementRateLimit } from '@/lib/rate-limit'
import type { RateLimitConfig } from '@/lib/rate-limit'

const ORDER_RATE_LIMIT: RateLimitConfig = {
  table: 'order_rate_limits',
  countColumn: 'request_count',
  lastColumn: 'last_request_at',
  firstColumn: 'first_request_at',
  maxAttempts: 5,
  windowMs: 60_000,
};

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const adminClient = createSupabaseAdminClient()
  const rateLimit = await checkAndIncrementRateLimit(adminClient, ip, ORDER_RATE_LIMIT)
  if (rateLimit.blocked) {
    return NextResponse.json({
      error: 'محاولات كثيرة جداً. يرجى الانتظار والمحاولة مرة أخرى.',
      cooldown: rateLimit.cooldown,
    }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Server-side bot detection — re-validate honeypot and timing
  const honeypotValue = (body.honeypot as string) || '';
  if (honeypotValue) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const submissionTime = (body.submission_time as number) || 0;
  if (submissionTime && Date.now() - submissionTime < 3000) {
    return NextResponse.json({ error: 'الرجاء الانتظار قليلاً قبل إرسال الطلب' }, { status: 400 })
  }

  delete body.honeypot
  delete body.submission_time
  const { cartItems, ...formData } = body

  const validation = checkoutSchema.safeParse(formData)
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {}
    validation.error.issues.forEach((err) => {
      const field = String(err.path[0])
      if (!fieldErrors[field]) fieldErrors[field] = err.message
    })
    return NextResponse.json({ error: 'Validation failed', fieldErrors }, { status: 400 })
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: 'السلة فارغة.' }, { status: 400 })
  }

  // Fetch current product prices from DB — never trust client prices
  const productIds = [...new Set(cartItems.map((item: { product: { id: string } }) => item.product.id))]
  const { data: dbProducts, error: priceErr } = await adminClient
    .from('products')
    .select('id, name, price, stock, is_active')
    .in('id', productIds)

  if (priceErr || !dbProducts) {
    return NextResponse.json({ error: 'فشل التحقق من المنتجات.' }, { status: 500 })
  }

  const productPriceMap = new Map(dbProducts.map((p: { id: string; name: string; price: number; stock: number; is_active: boolean }) => [p.id, p]))

  for (const item of cartItems) {
    if (!item.product?.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'بيانات المنتج غير صالحة.' }, { status: 400 })
    }
    const dbProduct = productPriceMap.get(item.product.id)
    if (!dbProduct) {
      return NextResponse.json({ error: `المنتج ${item.product.id} غير موجود.` }, { status: 400 })
    }
    if (!dbProduct.is_active) {
      return NextResponse.json({ error: `المنتج ${dbProduct.name || item.product.id} غير متاح حالياً.` }, { status: 400 })
    }
    if (dbProduct.stock < item.quantity) {
      return NextResponse.json({ error: `المنتج ${dbProduct.name || item.product.id} غير متوفر بالكمية المطلوبة.` }, { status: 400 })
    }
  }

  const trackingId = generateOrderId()
  let totalAmount = 0
  const timestamp = new Date().toISOString()

  const newItems = cartItems.map((item: { product: { id: string }; quantity: number }, index: number) => {
    const dbProduct = productPriceMap.get(item.product.id)!
    totalAmount += dbProduct.price * item.quantity
    return {
      id: `oi-${trackingId}-${index}`,
      order_id: trackingId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: dbProduct.price,
    }
  })

  const newOrder = {
    id_unique_tracking: trackingId,
    status: 'Pending Review',
    customer_name: validation.data.customer_name,
    phone_number: validation.data.phone_number,
    shipping_address: validation.data.shipping_address,
    total_amount: totalAmount,
    created_at: timestamp,
    admin_notes: '',
    location_link: validation.data.location_link || '',
    instapay_screenshot: formData.instapay_screenshot || '',
    instapay_phone_number: validation.data.instapay_phone_number || '',
  }

  const initialHistory = {
    id: `h-${trackingId}-init`,
    order_id: trackingId,
    status: 'Pending Review',
    timestamp,
  }

  const { error: oErr } = await adminClient.from('orders').insert([newOrder])
  if (oErr) {
    if (process.env.NODE_ENV !== 'production') console.error('Create order error:', oErr)
    return NextResponse.json({ error: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const [{ error: oiErr }, { error: hErr }] = await Promise.all([
    adminClient.from('order_items').insert(newItems),
    adminClient.from('order_status_history').insert([initialHistory]),
  ])

  if (oiErr || hErr) {
    await adminClient.from('orders').delete().eq('id_unique_tracking', trackingId).maybeSingle()
    if (process.env.NODE_ENV !== 'production') console.error('Create order rollback:', oiErr || hErr)
    return NextResponse.json({ error: 'فشل حفظ بيانات الطلب.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, trackingId })
}
