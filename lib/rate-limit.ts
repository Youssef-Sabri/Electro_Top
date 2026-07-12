import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { devLog } from '@/lib/dev-log'

interface RateLimitConfig {
  table: string;
  countColumn: string;
  lastColumn: string;
  firstColumn: string;
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitResult {
  blocked: boolean;
  cooldown?: number;
  limit: number;
  remaining: number;
}

interface RpcRateLimitRow {
  blocked: boolean;
  cooldown_secs: number;
  current_count: number;
}

export async function checkAndIncrementRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { data, error } = await client.rpc('atomic_rate_limit_check', {
    p_table:     config.table,
    p_ip:        ip,
    p_count_col: config.countColumn,
    p_first_col: config.firstColumn,
    p_last_col:  config.lastColumn,
    p_max:       config.maxAttempts,
    p_window_ms: config.windowMs,
  });

  if (error) {
    devLog('atomic_rate_limit_check RPC failed:', error.message);
    return { blocked: true, cooldown: 60, limit: config.maxAttempts, remaining: 0 };
  }

  const row = (Array.isArray(data) ? data[0] : data) as RpcRateLimitRow | undefined;
  if (!row) return { blocked: false, limit: config.maxAttempts, remaining: config.maxAttempts };

  return row.blocked
    ? { blocked: true, cooldown: row.cooldown_secs ?? 60, limit: config.maxAttempts, remaining: 0 }
    : { blocked: false, limit: config.maxAttempts, remaining: Math.max(0, config.maxAttempts - row.current_count) };
}

export function setRateLimitHeaders(response: NextResponse, result: RateLimitResult): void {
  response.headers.set('RateLimit-Limit', String(result.limit));
  response.headers.set('RateLimit-Remaining', String(result.remaining));
}
