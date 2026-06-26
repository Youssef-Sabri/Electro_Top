import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'
import { detectImageMimeType } from '@/lib/magic-bytes'
import { checkAndIncrementRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/ip-utils'
import { TABLES, STORAGE_BUCKETS } from '@/lib/db-constants'

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rateCheck = await checkAndIncrementRateLimit(createSupabaseAdminClient(), ip, {
    table: TABLES.orderRateLimits,
    countColumn: 'request_count',
    lastColumn: 'last_request_at',
    firstColumn: 'first_request_at',
    maxAttempts: 3,
    windowMs: 60000,
  })
  if (rateCheck.blocked) {
    return NextResponse.json({ error: `محاولات كثيرة جداً. يرجى الانتظار ${rateCheck.cooldown} ثانية.` }, { status: 429 })
  }

  let body: { file?: string; filename?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

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

  if (fileBuffer.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت.' }, { status: 400 })
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
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).charAt(0)).join('')
  const fileName = `receipt-${random}.${ext}`

  const supabaseClient = createSupabaseAdminClient()

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKETS.receipts)
    .upload(fileName, fileBuffer, {
      contentType: detectedType,
      metadata: { mimetype: detectedType },
    })

  if (uploadError) {
    return NextResponse.json({ error: 'فشل رفع الملف إلى التخزين.' }, { status: 500 })
  }

  return NextResponse.json({ fileName })
}
