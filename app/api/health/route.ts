import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { TABLES } from '@/lib/db-constants'

export async function GET() {
  const start = Date.now()
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.from(TABLES.products).select('id').limit(1).maybeSingle()

  const dbHealthy = !error
  const responseTime = Date.now() - start

  const status = dbHealthy ? 'healthy' : 'degraded'
  const httpStatus = dbHealthy ? 200 : 503

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    responseTimeMs: responseTime,
  }, { status: httpStatus })
}
