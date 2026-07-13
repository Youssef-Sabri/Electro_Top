import { NextResponse } from 'next/server'
import { requireAdminGuard } from '@/lib/auth'
import { detectImageMimeType, EXT_MAP } from '@/lib/utils/file'
import { STORAGE_BUCKETS } from '@/lib/constants'
import { MAX_FILE_SIZE_BYTES } from '@/lib/constants'

export async function POST(request: Request) {
  const guard = await requireAdminGuard(request)
  if (guard instanceof NextResponse) return guard
  const { supabaseClient } = guard

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

  if (file.size > MAX_FILE_SIZE_BYTES) {
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
  const randomPart = crypto.randomUUID()  // Use full UUID to minimize collision risk
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
