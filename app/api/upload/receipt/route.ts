import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { validateRequestOrigin } from '@/lib/csrf'

function isAllowedMime(mime: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mime)
}

function validateMagicBytes(buffer: Uint8Array, mime: string): boolean {
  const header = Array.from(buffer.slice(0, 12))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')

  switch (mime) {
    case 'image/jpeg':
      return header.startsWith('ff d8 ff')
    case 'image/png':
      return header.startsWith('89 50 4e 47')
    case 'image/webp': {
      if (!header.startsWith('52 49 46 46')) return false
      const webpHeader = Array.from(buffer.slice(8, 12))
        .map((b) => String.fromCharCode(b))
        .join('')
      return webpHeader === 'WEBP'
    }
    default:
      return false
  }
}

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  const mime = match[1]
  if (!isAllowedMime(mime)) {
    return NextResponse.json({ error: 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WEBP.' }, { status: 400 })
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

  if (!validateMagicBytes(fileBuffer, mime)) {
    return NextResponse.json({ error: 'الملف لا يبدو صورة صالحة. تم رفض الرفع.' }, { status: 400 })
  }

  const ext = mime.split('/')[1]
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(36).charAt(0)).join('')
  const fileName = `receipt-${random}.${ext}`

  const supabaseClient = createSupabaseAdminClient()

  const { error: uploadError } = await supabaseClient.storage
    .from('instapay-receipts')
    .upload(fileName, fileBuffer, {
      contentType: mime,
      metadata: { mimetype: mime },
    })

  if (uploadError) {
    return NextResponse.json({ error: 'فشل رفع الملف إلى التخزين.' }, { status: 500 })
  }

  return NextResponse.json({ fileName })
}
