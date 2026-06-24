import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    const violation = report?.['csp-report'] || report;
    console.error('[CSP Violation]', JSON.stringify(violation));
  } catch {
    // Malformed report body — ignore silently
  }

  return new NextResponse(null, { status: 204 });
}
