import { NextRequest, NextResponse } from 'next/server';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getClientIp } from '@/lib/ip-utils';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = await checkAndIncrementRateLimit(createSupabaseAdminClient(), ip, {
    table: 'order_rate_limits',
    countColumn: 'request_count',
    lastColumn: 'last_request_at',
    firstColumn: 'first_request_at',
    maxAttempts: 10,
    windowMs: 60000,
  });
  if (rateCheck.blocked) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    const report = await request.json();
    const violation = report?.['csp-report'] || report;
    if (process.env.NODE_ENV !== 'production') {
      console.error('[CSP Violation]', JSON.stringify(violation));
    }
  } catch {
    // Malformed report body — ignore silently
  }

  return new NextResponse(null, { status: 204 });
}
