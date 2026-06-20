import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

function cleanup() {
  const now = Date.now();
  if (store.size > 1000) {
    for (const [key, val] of store) {
      if (now >= val.resetAt) store.delete(key);
    }
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  cleanup();

  const entry = store.get(ip);
  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({
      blocked: true,
      cooldown: Math.ceil((entry.resetAt - now) / 1000),
    });
  }

  return NextResponse.json({ blocked: false });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  cleanup();

  // Check rate limit first
  const entry = store.get(ip);
  if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({
      blocked: true,
      cooldown: Math.ceil((entry.resetAt - now) / 1000),
    }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!adminEmail || email.trim() !== adminEmail) {
    // Increment rate limit attempts
    if (!entry || now >= entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
    }
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. غير مسموح بالدخول.',
      attempts: store.get(ip)?.count ?? 1,
    }, { status: 401 });
  }

  // Initialize Supabase Server Client
  const cookieStore = await cookies();

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

  const { data: { user }, error: loginError } = await supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (loginError || !user) {
    // Increment rate limit attempts
    if (!entry || now >= entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
    }
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts: store.get(ip)?.count ?? 1,
    }, { status: 401 });
  }

  // Successful login, clear IP rate limit entry
  store.delete(ip);

  // Return success response. Note: createServerClient writes directly to the cookies via the proxy setters.
  return NextResponse.json({ success: true, user });
}
