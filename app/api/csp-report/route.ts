import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    const violation = report?.['csp-report'] || report;

    if (process.env.NODE_ENV !== 'production') console.error('[CSP Violation]', JSON.stringify(violation));

    const supabaseClient = createSupabaseAdminClient();

    await supabaseClient.from('csp_violations').insert({
      document_uri: violation['document-uri'],
      referrer: violation['referrer'],
      blocked_uri: violation['blocked-uri'],
      violated_directive: violation['violated-directive'],
      effective_directive: violation['effective-directive'],
      original_policy: violation['original-policy'],
      source_file: violation['source-file'],
      line_number: violation['line-number'],
      column_number: violation['column-number'],
      disposition: violation['disposition'],
      user_agent: request.headers.get('user-agent') || null,
    });
  } catch {
    // Malformed report body — ignore silently
  }

  return new NextResponse(null, { status: 204 });
}
