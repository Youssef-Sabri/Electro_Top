import { NextResponse } from 'next/server'

export async function GET() {
  // Rely on the proxy.ts middleware to validate the admin session.
  // This bypasses the GET route handler cookie modification restriction in Next.js.
  return NextResponse.json({ verified: true })
}
