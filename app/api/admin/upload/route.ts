import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'
import { detectImageMimeType } from '@/lib/magic-bytes'
import { STORAGE_BUCKETS } from '@/lib/db-constants'

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const authResult = await requireAdmin(supabaseClient)
  if (authResult instanceof NextResponse) return authResult

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `حجم الملف كبير جداً (${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت). الحد الأقصى 5 ميجابايت.` },
      { status: 400 }
    )
  }

  // Verify file content via magic bytes (prevents MIME spoofing)
  const fileBuffer = await file.arrayBuffer()
  const detectedType = detectImageMimeType(fileBuffer)
  if (!detectedType || !EXT_MAP[detectedType]) {
    return NextResponse.json(
      { error: 'يُقبل فقط ملفات الصور (JPG, PNG, WEBP, GIF, HEIC).' },
      { status: 400 }
    )
  }

  // Cross-check: reject if client MIME doesn't match detected content
  const clientType = file.type.split(';')[0].trim()
  if (clientType && EXT_MAP[clientType] && clientType !== detectedType) {
    return NextResponse.json(
      { error: 'نوع الملف لا يتطابق مع المحتوى الفعلي.' },
      { status: 400 }
    )
  }

  const ext = EXT_MAP[detectedType]
  const randomPart = crypto.randomUUID().split('-')[0]
  const fileName = `product-${randomPart}.${ext}`

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKETS.productImages)
    .upload(fileName, file, {
      contentType: detectedType,
      upsert: false,
    })

  if (uploadError) {
    if (process.env.NODE_ENV !== 'production') console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseClient.storage
    .from(STORAGE_BUCKETS.productImages)
    .getPublicUrl(fileName)

  return NextResponse.json({ imageUrl: publicUrl })
}
