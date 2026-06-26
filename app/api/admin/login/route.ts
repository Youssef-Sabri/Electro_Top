import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { getServerSupabase } from '@/lib/supabase-server-cookies'
import { validateRequestOrigin } from '@/lib/csrf'
import { getClientIp } from '@/lib/ip-utils'
import { checkAndIncrementRateLimit } from '@/lib/rate-limit'
import type { RateLimitConfig } from '@/lib/rate-limit'
import { TABLES } from '@/lib/db-constants'

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  table: TABLES.loginAttempts,
  countColumn: 'attempt_count',
  lastColumn: 'last_attempt_at',
  firstColumn: 'first_attempt_at',
  maxAttempts: 5,
  windowMs: 60_000,
};

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const supabaseClient = createSupabaseAdminClient()

  const { data, error } = await supabaseClient
    .from(LOGIN_RATE_LIMIT.table)
    .select('attempt_count, first_attempt_at')
    .eq('ip_address', ip)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ blocked: false });
  }

  const elapsed = Date.now() - new Date(data.first_attempt_at).getTime();
  const blocked = data.attempt_count >= LOGIN_RATE_LIMIT.maxAttempts && elapsed < LOGIN_RATE_LIMIT.windowMs;
  const cooldown = blocked ? Math.ceil((LOGIN_RATE_LIMIT.windowMs - elapsed) / 1000) : undefined;

  return NextResponse.json({ blocked, cooldown });
}

export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ip = getClientIp(request);
  const supabaseClient = createSupabaseAdminClient()

  // Atomic check-and-increment — prevents TOCTOU race under concurrent serverless invocations
  const rateLimit = await checkAndIncrementRateLimit(supabaseClient, ip, LOGIN_RATE_LIMIT);
  if (rateLimit.blocked) {
    return NextResponse.json({
      blocked: true,
      cooldown: rateLimit.cooldown,
    }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email as string | undefined;
  const password = body.password as string | undefined;
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
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts: undefined,
    }, { status: 401 });
  }

  // Verify the authenticated user has the admin role in their app_metadata
  if (user.app_metadata?.role !== 'admin') {
    await supabaseClientWithCookies.auth.signOut();
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts: undefined,
    }, { status: 401 });
  }

  // Successful login, clear rate limit entries via DELETE
  await supabaseClient
    .from(LOGIN_RATE_LIMIT.table)
    .delete()
    .eq('ip_address', ip)
    .lt('first_attempt_at', new Date(Date.now() - LOGIN_RATE_LIMIT.windowMs).toISOString());

  // Return success response. Note: createServerClient writes directly to the cookies via the proxy setters.
  return NextResponse.json({ success: true });
}
