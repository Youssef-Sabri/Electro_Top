import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabaseClient = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      cookieStore.set(name, value, options as Partial<ResponseCookie>)
    },
    remove(name: string, options: Record<string, unknown>) {
      cookieStore.set(name, '', { ...options, maxAge: -1 } as Partial<ResponseCookie>)
    },
  })

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (authError || !user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const ext = ALLOWED_MIME_TYPES[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'يُقبل فقط ملفات الصور (JPG, PNG, WEBP, GIF, HEIC).' },
      { status: 400 }
    )
  }

  const randomPart = crypto.randomUUID().split('-')[0]
  const fileName = `product-${randomPart}.${ext}`

  const { error: uploadError } = await supabaseClient.storage
    .from('product-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseClient.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ imageUrl: publicUrl })
}
