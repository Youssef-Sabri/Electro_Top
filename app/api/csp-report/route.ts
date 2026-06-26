import { NextRequest, NextResponse } from 'next/server';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getClientIp } from '@/lib/ip-utils';
import { TABLES } from '@/lib/db-constants';

const CSP_RATE_LIMIT = {
  table: TABLES.orderRateLimits,
  countColumn: 'request_count' as const,
  lastColumn: 'last_request_at' as const,
  firstColumn: 'first_request_at' as const,
  maxAttempts: 10,
  windowMs: 60000,
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = await checkAndIncrementRateLimit(createSupabaseAdminClient(), ip, CSP_RATE_LIMIT);
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
