import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

async function checkRateLimit(supabaseClient: SupabaseClient, ip: string) {
  const { data } = await supabaseClient
    .from('login_attempts')
    .select('attempt_count, last_attempt_at')
    .eq('ip_address', ip)
    .single();

  if (!data) return { blocked: false };

  const elapsed = Date.now() - new Date(data.last_attempt_at).getTime();
  if (elapsed > WINDOW_MS) {
    await supabaseClient.from('login_attempts').delete().eq('ip_address', ip);
    return { blocked: false };
  }

  if (data.attempt_count >= MAX_ATTEMPTS) {
    return { blocked: true, cooldown: Math.ceil((WINDOW_MS - elapsed) / 1000) };
  }

  return { blocked: false, count: data.attempt_count };
}

async function incrementAttempts(supabaseClient: SupabaseClient, ip: string) {
  const { data } = await supabaseClient
    .from('login_attempts')
    .select('attempt_count')
    .eq('ip_address', ip)
    .single();

  const now = new Date().toISOString();

  if (!data) {
    await supabaseClient.from('login_attempts').insert({
      ip_address: ip,
      attempt_count: 1,
      first_attempt_at: now,
      last_attempt_at: now,
    });
    return 1;
  }

  const { error } = await supabaseClient
    .from('login_attempts')
    .update({ attempt_count: data.attempt_count + 1, last_attempt_at: now })
    .eq('ip_address', ip);

  if (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Rate limit increment failed:', error.message);
  }

  return data.attempt_count + 1;
}

async function clearAttempts(supabaseClient: SupabaseClient, ip: string) {
  await supabaseClient.from('login_attempts').delete().eq('ip_address', ip);
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const supabaseClient = createSupabaseServerClient({
    get() { return undefined },
    set() {},
    remove() {},
  })

  const rateLimit = await checkRateLimit(supabaseClient, ip);
  if (rateLimit.blocked) {
    return NextResponse.json({ blocked: true, cooldown: rateLimit.cooldown });
  }

  return NextResponse.json({ blocked: false });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const supabaseClient = createSupabaseServerClient({
    get() { return undefined },
    set() {},
    remove() {},
  })

  // Check rate limit first
  const rateLimit = await checkRateLimit(supabaseClient, ip);
  if (rateLimit.blocked) {
    return NextResponse.json({
      blocked: true,
      cooldown: rateLimit.cooldown,
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

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || email.trim() !== adminEmail) {
    const attempts = await incrementAttempts(supabaseClient, ip);
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. غير مسموح بالدخول.',
      attempts,
    }, { status: 401 });
  }

  // Initialize Supabase Server Client with cookies for auth
  const cookieStore = await cookies();

  const supabaseClientWithCookies = createSupabaseServerClient({
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

  const { data: { user }, error: loginError } = await supabaseClientWithCookies.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (loginError || !user) {
    const attempts = await incrementAttempts(supabaseClient, ip);
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts,
    }, { status: 401 });
  }

  // Successful login, clear rate limit entries
  await clearAttempts(supabaseClient, ip);

  // Return success response. Note: createServerClient writes directly to the cookies via the proxy setters.
  return NextResponse.json({ success: true, user });
}
