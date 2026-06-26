import { NextResponse } from 'next/server'

export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
