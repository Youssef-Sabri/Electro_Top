import { NextRequest, NextResponse } from 'next/server';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getClientIp } from '@/lib/ip-utils';
import { RATE_LIMIT_CONFIGS } from '@/lib/db-constants';
import { parseJsonBody } from '@/lib/parse-json';


const CSP_RATE_LIMIT = RATE_LIMIT_CONFIGS.cspReport;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = await checkAndIncrementRateLimit(createSupabaseAdminClient(), ip, CSP_RATE_LIMIT);
  if (rateCheck.blocked) {
    return new NextResponse(null, { status: 429 });
  }

  const body = await parseJsonBody(request);
  if (!(body instanceof NextResponse)) {
    const report = body;
    const violation = report?.['csp-report'] || report;
    if (process.env.NODE_ENV !== 'production') {
      console.error('[CSP Violation]', JSON.stringify(violation));
    }
  }

  return new NextResponse(null, { status: 204 });
}
