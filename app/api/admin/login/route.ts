import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { getClientIp } from '@/lib/ip-utils'
import { checkRateLimit, incrementRateLimit, clearRateLimit } from '@/lib/rate-limit'
import type { RateLimitConfig } from '@/lib/rate-limit'

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  table: 'login_attempts',
  countColumn: 'attempt_count',
  lastColumn: 'last_attempt_at',
  firstColumn: 'first_attempt_at',
  maxAttempts: 5,
  windowMs: 60_000,
};

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const supabaseClient = createSupabaseAdminClient()

  const rateLimit = await checkRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);
  if (rateLimit.blocked) {
    return NextResponse.json({ blocked: true, cooldown: rateLimit.cooldown });
  }

  return NextResponse.json({ blocked: false });
}

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request);

  const supabaseClient = createSupabaseAdminClient()


  // Check rate limit first
  const rateLimit = await checkRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);
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

  // Initialize Supabase Server Client with cookies for auth
  const supabaseClientWithCookies = await getServerSupabase()

  const { data: { user }, error: loginError } = await supabaseClientWithCookies.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (loginError || !user) {
    const attempts = await incrementRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);
    await supabaseClient.from('admin_audit_log').insert({
      admin_email: email,
      action: 'login_failed',
      details: { ip, reason: loginError?.message || 'User not found' }
    }).maybeSingle();
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts,
    }, { status: 401 });
  }

  // Verify the authenticated user has the admin role in their app_metadata
  if (user.app_metadata?.role !== 'admin') {
    await supabaseClientWithCookies.auth.signOut();
    const attempts = await incrementRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);
    await supabaseClient.from('admin_audit_log').insert({
      admin_email: user.email,
      action: 'login_failed',
      details: { ip, reason: 'User is not admin' }
    }).maybeSingle();
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts,
    }, { status: 401 });
  }

  // Successful login, clear rate limit entries
  await clearRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);

  // Server-Side Audit Log
  await supabaseClient.from('admin_audit_log').insert({
    admin_id: user.id,
    admin_email: user.email,
    action: 'login',
    details: { ip }
  }).maybeSingle();

  // Return success response. Note: createServerClient writes directly to the cookies via the proxy setters.
  return NextResponse.json({ success: true, user });
}
