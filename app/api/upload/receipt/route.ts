import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { validateRequestOrigin, checkAndIncrementRateLimit, generateFingerprint } from '@/lib/security'
import { detectImageMimeType } from '@/lib/utils/file'
import { TABLES, STORAGE_BUCKETS, MAX_FILE_SIZE_BYTES } from '@/lib/constants'
import { parseJsonBody } from '@/lib/utils/misc'
import { SAFE_FILENAME_RE } from '@/lib/validations'

const RECEIPT_RATE_LIMIT = {
  table: TABLES.orderRateLimits,
  countColumn: 'request_count',
  lastColumn: 'last_request_at',
  firstColumn: 'first_request_at',
  maxAttempts: 5,
  windowMs: 60_000,
}

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const referer = request.headers.get('referer') || ''
  const isCheckoutPage = referer.includes('/checkout') || referer.includes('/cart')
  if (!isCheckoutPage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fingerprint = generateFingerprint(request)
  const adminClient = createSupabaseAdminClient()
  const rateLimit = await checkAndIncrementRateLimit(adminClient, fingerprint, RECEIPT_RATE_LIMIT)
  if (rateLimit.blocked) {
    return NextResponse.json({ error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.' }, { status: 429 })
  }

  const body = await parseJsonBody<{ file?: string; filename?: string }>(request)
  if (body instanceof NextResponse) return body

  if (!body.file || typeof body.file !== 'string') {
    return NextResponse.json({ error: 'الملف مطلوب.' }, { status: 400 })
  }

  const match = body.file.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!match) {
    return NextResponse.json({ error: 'تنسيق الملف غير صالح.' }, { status: 400 })
  }

  let rawBase64: string
  try {
    rawBase64 = decodeURIComponent(match[2])
  } catch {
    rawBase64 = match[2]
  }

  // Reject oversized payload before allocating memory — estimate from base64 length
  const estimatedBytes = Math.ceil(rawBase64.length * 3 / 4)
  if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.' }, { status: 400 })
  }

  let fileBuffer: Uint8Array
  try {
    const binary = atob(rawBase64)
    fileBuffer = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      fileBuffer[i] = binary.charCodeAt(i)
    }
  } catch {
    return NextResponse.json({ error: 'بيانات الملف تالفة.' }, { status: 400 })
  }

  const detectedType = detectImageMimeType(fileBuffer)
  if (!detectedType) {
    return NextResponse.json({ error: 'الملف لا يبدو صورة صالحة. الأنواع المسموحة: JPG, PNG, WEBP, HEIC, GIF.' }, { status: 400 })
  }

  const clientMime = match[1]
  if (clientMime !== detectedType) {
    return NextResponse.json({ error: 'نوع الملف المذكور لا يتطابق مع المحتوى الفعلي.' }, { status: 400 })
  }

  const [, ext] = detectedType.split('/')
  const fileName = `receipt-${crypto.randomUUID().replaceAll('-', '')}.${ext}`

  const supabaseClient = adminClient

const { error: uploadError } = await supabaseClient.storage
     .from(STORAGE_BUCKETS.receipts)
     .upload(fileName, fileBuffer, {
       contentType: detectedType,
       metadata: { mimetype: detectedType },
       upsert: false,
     })

  if (uploadError) {
    return NextResponse.json({ error: 'فشل رفع الملف إلى التخزين.' }, { status: 500 })
  }

  return NextResponse.json({ fileName })
}

// Allows the client to delete an orphaned upload if the subsequent order-creation transaction fails.
export async function DELETE(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fingerprint = generateFingerprint(request)
  const adminClient = createSupabaseAdminClient()
  const rateLimit = await checkAndIncrementRateLimit(adminClient, fingerprint, RECEIPT_RATE_LIMIT)
  if (rateLimit.blocked) {
    return NextResponse.json({ error: 'تم تجاوز حد الطلبات.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') ?? ''

  if (!filename || !SAFE_FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // Verify the receipt does not belong to an active order
  const { data: linkedOrder, error: checkError } = await adminClient
    .from(TABLES.orders)
    .select('id_unique_tracking')
    .eq('instapay_screenshot', filename)
    .maybeSingle()

  if (checkError) {
    return NextResponse.json({ error: 'Failed to verify receipt status.' }, { status: 500 })
  }

  if (linkedOrder) {
    return NextResponse.json({ error: 'Cannot delete receipt for an active order.' }, { status: 400 })
  }

  const { error: removeError } = await adminClient.storage
    .from(STORAGE_BUCKETS.receipts)
    .remove([filename])

  if (removeError) {
    return NextResponse.json({ error: 'Failed to delete file.' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
