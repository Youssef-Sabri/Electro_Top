import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { validateRequestOrigin } from '@/lib/security'
import { checkoutSchema, SAFE_FILENAME_RE } from '@/lib/validations'
import { generateOrderId, getClientIp, parseJsonBody, devLog } from '@/lib/utils/misc'
import { checkAndIncrementRateLimit, setRateLimitHeaders } from '@/lib/security'
import { RATE_LIMIT_CONFIGS } from '@/lib/constants'
import { now } from '@/lib/utils/date'

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
      error: `محاولات كثيرة جداً. يرجى الانتظار ${rateLimit.cooldown} ثانية ثم المحاولة مرة أخرى.`,
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

  // Validate all product IDs exist and are active, fetch current prices/stock
  const productIds = cartItems.map((item: { product: { id: string } }) => item.product.id)
  const { data: serverProducts, error: prodErr } = await adminClient
    .from('products')
    .select('id, price, stock, is_active, name')
    .in('id', productIds)

  if (prodErr || !serverProducts) {
    return NextResponse.json({ error: 'فشل التحقق من المنتجات.' }, { status: 500 })
  }

  const productMap = new Map(serverProducts.map((p) => [p.id, p]))

  for (const item of cartItems) {
    if (!item.product?.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return NextResponse.json({ error: 'بيانات المنتج غير صالحة.' }, { status: 400 })
    }
    const serverProduct = productMap.get(item.product.id)
    if (!serverProduct) {
      return NextResponse.json({ error: `المنتج "${item.product.id}" غير موجود.` }, { status: 400 })
    }
    if (!serverProduct.is_active) {
      return NextResponse.json({ error: `المنتج "${serverProduct.name}" لم يعد متاحاً.` }, { status: 400 })
    }
    if (item.quantity > serverProduct.stock) {
      return NextResponse.json({ error: `الكمية المطلوبة للمنتج "${serverProduct.name}" غير متوفرة (متوفر: ${serverProduct.stock}).` }, { status: 400 })
    }
  }

  const trackingId = generateOrderId()
  const timestamp = now()

  // Validate instapay_screenshot: must be a storage filename or empty string — never a data-URI
  const screenshotValue = (formData.instapay_screenshot as string) || ''
  if (screenshotValue && !SAFE_FILENAME_RE.test(screenshotValue)) {
    return NextResponse.json({ error: 'Invalid instapay_screenshot format.' }, { status: 400 })
  }

  const newItems = cartItems.map((item: { product: { id: string }; quantity: number; selectedColor?: string | null }, index: number) => {
    return {
      id: `oi-${trackingId}-${index}`,
      order_id: trackingId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: 0, // overridden by before_order_item_insert database trigger
      selected_color: item.selectedColor || null,
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
