import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { checkoutSchema, SAFE_FILENAME_RE } from '@/lib/validators'
import { generateOrderId } from '@/lib/id-generator'
import { getClientIp } from '@/lib/ip-utils'
import { checkAndIncrementRateLimit, setRateLimitHeaders } from '@/lib/rate-limit'
import { TABLES, RATE_LIMIT_CONFIGS } from '@/lib/db-constants'
import { now } from '@/lib/date-utils'
import { parseJsonBody } from '@/lib/parse-json'
import { devLog } from '@/lib/dev-log'

const ORDER_RATE_LIMIT = RATE_LIMIT_CONFIGS.order;

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const adminClient = createSupabaseAdminClient()
  const rateLimit = await checkAndIncrementRateLimit(adminClient, ip, ORDER_RATE_LIMIT)
  if (rateLimit.blocked) {
    const res = NextResponse.json({
      error: 'محاولات كثيرة جداً. يرجى الانتظار والمحاولة مرة أخرى.',
      cooldown: rateLimit.cooldown,
    }, { status: 429 })
    setRateLimitHeaders(res, rateLimit)
    return res
  }

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

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

  for (const item of cartItems) {
    if (!item.product?.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'بيانات المنتج غير صالحة.' }, { status: 400 })
    }
  }

  const trackingId = generateOrderId()
  const timestamp = now()

  // Validate instapay_screenshot: must be a storage filename or empty string — never a data-URI
  const screenshotValue = (formData.instapay_screenshot as string) || ''
  if (screenshotValue && !SAFE_FILENAME_RE.test(screenshotValue)) {
    return NextResponse.json({ error: 'Invalid instapay_screenshot format.' }, { status: 400 })
  }

  const newItems = cartItems.map((item: { product: { id: string }; quantity: number }, index: number) => {
    return {
      id: `oi-${trackingId}-${index}`,
      order_id: trackingId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: 0, // overridden by before_order_item_insert database trigger
    }
  })

  const newOrder = {
    id_unique_tracking: trackingId,
    status: 'Pending Review',
    customer_name: validation.data.customer_name,
    phone_number: validation.data.phone_number,
    shipping_address: validation.data.shipping_address,
    total_amount: 0,
    created_at: timestamp,
    admin_notes: '',
    payment_method: validation.data.payment_method,
    location_link: validation.data.location_link || '',
    instapay_screenshot: screenshotValue,
    instapay_phone_number: validation.data.instapay_phone_number || '',
  }

  const { data: createdTrackingId, error: txErr } = await adminClient.rpc('create_order_transaction', {
    p_order: newOrder,
    p_items: newItems,
  })

  if (txErr) {
    devLog('Create order transaction error:', txErr)
    const errorMsg = txErr.message || ''
    
    if (errorMsg.includes('Too many orders from this phone number')) {
      return NextResponse.json(
        { error: 'لقد قمت بإنشاء عدد كبير جداً من الطلبات من هذا الرقم مؤخراً. يرجى الانتظار 15 دقيقة والمحاولة مرة أخرى.' },
        { status: 429 }
      )
    }
    if (errorMsg.includes('Insufficient stock')) {
      return NextResponse.json({ error: 'عذراً، بعض المنتجات لم تعد متوفرة بالكمية المطلوبة.' }, { status: 400 })
    }
    if (errorMsg.includes('Product not found')) {
      return NextResponse.json({ error: 'بعض المنتجات المحددة غير موجودة.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, trackingId: createdTrackingId || trackingId })
}
