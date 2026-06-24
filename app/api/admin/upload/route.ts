import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { requireAdmin } from '@/lib/api-auth'

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

async function detectMimeType(buffer: ArrayBuffer): Promise<string | null> {
  const arr = new Uint8Array(buffer)
  const len = arr.length
  if (len < 12) return null

  const header = Array.from(arr.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' ')

  // JPEG: starts with FF D8
  if (header.startsWith('ff d8')) return 'image/jpeg'
  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (header.startsWith('89 50 4e 47 0d 0a 1a 0a')) return 'image/png'
  // WEBP: starts with RIFF .... WEBP
  if (header.startsWith('52 49 46 46')) {
    const webpTag = String.fromCharCode(arr[8], arr[9], arr[10], arr[11])
    if (webpTag === 'WEBP') return 'image/webp'
  }
  // GIF: starts with GIF87a or GIF89a
  if (header.startsWith('47 49 46 38 37 61') || header.startsWith('47 49 46 38 39 61')) return 'image/gif'
  // HEIC/HEIF: contains 'ftyp' box
  const ftypMarker = String.fromCharCode(arr[4], arr[5], arr[6], arr[7])
  if (ftypMarker === 'ftyp') {
    const brand = String.fromCharCode(arr[8], arr[9], arr[10], arr[11])
    if (brand.startsWith('heic') || brand.startsWith('heix') || brand.startsWith('heim') || brand.startsWith('heis') || brand.startsWith('mif1') || brand.startsWith('msf1')) {
      return 'image/heic'
    }
  }

  return null
}

export async function POST(request: Request) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseClient = await getServerSupabase()

  const adminOrError = await requireAdmin(supabaseClient)
  if (adminOrError instanceof NextResponse) return adminOrError
  const user = adminOrError

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
  const detectedType = await detectMimeType(fileBuffer)
  if (!detectedType || !ALLOWED_MIME_TYPES[detectedType]) {
    return NextResponse.json(
      { error: 'يُقبل فقط ملفات الصور (JPG, PNG, WEBP, GIF, HEIC).' },
      { status: 400 }
    )
  }

  // Cross-check: reject if client MIME doesn't match detected content
  const clientType = file.type.split(';')[0].trim()
  if (clientType && ALLOWED_MIME_TYPES[clientType] && clientType !== detectedType) {
    return NextResponse.json(
      { error: 'نوع الملف لا يتطابق مع المحتوى الفعلي.' },
      { status: 400 }
    )
  }

  const ext = ALLOWED_MIME_TYPES[detectedType]
  const randomPart = crypto.randomUUID().split('-')[0]
  const fileName = `product-${randomPart}.${ext}`

  const { error: uploadError } = await supabaseClient.storage
    .from('product-images')
    .upload(fileName, file, {
      contentType: detectedType,
      upsert: false,
    })

  if (uploadError) {
    if (process.env.NODE_ENV !== 'production') console.error('Upload error:', uploadError);
    return NextResponse.json({ error: 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseClient.storage
    .from('product-images')
    .getPublicUrl(fileName)

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'upload_product_image',
    details: { filename: fileName }
  })

  return NextResponse.json({ imageUrl: publicUrl })
}
