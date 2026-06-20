import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { checkoutSchema } from '@/lib/validators'
import { generateOrderId } from '@/lib/id-generator'

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

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

  const supabaseClient = createSupabaseServerClient({
    get() { return undefined },
    set() {},
    remove() {},
  })

  const trackingId = generateOrderId()
  const totalAmount = cartItems.reduce(
    (acc: number, item: { product: { price: number }; quantity: number }) => acc + item.product.price * item.quantity,
    0
  )
  const timestamp = new Date().toISOString()

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

  const newItems = cartItems.map((item: { product: { id: string; price: number }; quantity: number }, index: number) => ({
    id: `oi-${trackingId}-${index}`,
    order_id: trackingId,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
  }))

  const initialHistory = {
    id: `h-${trackingId}-init`,
    order_id: trackingId,
    status: 'Pending Review',
    timestamp,
  }

  const { error: oErr } = await supabaseClient.from('orders').insert([newOrder])
  if (oErr) {
    if (process.env.NODE_ENV !== 'production') console.error('Create order error:', oErr)
    return NextResponse.json({ error: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const [{ error: oiErr }, { error: hErr }] = await Promise.all([
    supabaseClient.from('order_items').insert(newItems),
    supabaseClient.from('order_status_history').insert([initialHistory]),
  ])

  if (oiErr || hErr) {
    await supabaseClient.from('orders').delete().eq('id_unique_tracking', trackingId).maybeSingle()
    if (process.env.NODE_ENV !== 'production') console.error('Create order rollback:', oiErr || hErr)
    return NextResponse.json({ error: 'فشل حفظ بيانات الطلب.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, trackingId })
}
