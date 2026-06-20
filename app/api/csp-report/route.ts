import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    if (process.env.NODE_ENV !== 'production') {
      console.error('CSP Violation:', JSON.stringify(report, null, 2));
    }
  } catch {
    // Malformed report body — ignore silently
  }

  return new NextResponse(null, { status: 204 });
}
