import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, getServerSupabase } from '@/lib/supabase/server'
import { validateRequestOrigin, checkAndIncrementRateLimit, setRateLimitHeaders, generateFingerprint } from '@/lib/security'
import { RATE_LIMIT_CONFIGS, isAdminRole } from '@/lib/constants'
import { parseJsonBody } from '@/lib/utils/misc'

export async function GET(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fingerprint = generateFingerprint(request);
  const supabaseClient = createSupabaseAdminClient()
  
  const { data, error } = await supabaseClient
    .from(RATE_LIMIT_CONFIGS.login.table)
    .select('attempt_count, first_attempt_at')
    .eq('ip_address', fingerprint)
    .maybeSingle();
  
  if (error || !data) {
    return NextResponse.json({ blocked: false });
  }
  
  const elapsed = Date.now() - new Date(data.first_attempt_at).getTime();
  const blocked = data.attempt_count >= RATE_LIMIT_CONFIGS.login.maxAttempts && elapsed < RATE_LIMIT_CONFIGS.login.windowMs;
  const cooldown = blocked ? Math.ceil((RATE_LIMIT_CONFIGS.login.windowMs - elapsed) / 1000) : undefined;
  
  return NextResponse.json({ blocked, cooldown });
}


export async function POST(request: NextRequest) {
  if (!validateRequestOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fingerprint = generateFingerprint(request);
  const supabaseClient = createSupabaseAdminClient()

  // Atomic check-and-increment — prevents TOCTOU race under concurrent serverless invocations
  const rateLimit = await checkAndIncrementRateLimit(supabaseClient, fingerprint, RATE_LIMIT_CONFIGS.login);
  if (rateLimit.blocked) {
    const res = NextResponse.json({
      blocked: true,
      cooldown: rateLimit.cooldown,
    }, { status: 429 });
    setRateLimitHeaders(res, rateLimit)
    return res
  }

  const body = await parseJsonBody<Record<string, unknown>>(request)
  if (body instanceof NextResponse) return body

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
  if (!isAdminRole(user.app_metadata?.role)) {
    await supabaseClientWithCookies.auth.signOut({ scope: 'local' });
    return NextResponse.json({
      error: 'فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.',
      attempts: undefined,
    }, { status: 401 });
  }

  // Successful login, clear rate limit entries via DELETE
  await supabaseClient
    .from(RATE_LIMIT_CONFIGS.login.table)
    .delete()
    .eq('ip_address', fingerprint);

  // Return success response. Note: createServerClient writes directly to the cookies via the proxy setters.
  return NextResponse.json({ success: true });
}
