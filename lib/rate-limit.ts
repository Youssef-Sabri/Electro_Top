import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitConfig {
  table: string;
  countColumn: string;
  lastColumn: string;
  firstColumn: string;
  maxAttempts: number;
  windowMs: number;
}

// Atomic check-and-increment via a single Postgres RPC (INSERT ... ON CONFLICT ... DO UPDATE).
// Replaces the previous two-step SELECT + UPDATE pattern which had a TOCTOU race under concurrent
// serverless invocations. The RPC (atomic_rate_limit_check) must exist in the database — see setup.html Step 5.
export async function checkAndIncrementRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<{ blocked: boolean; cooldown?: number }> {
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('atomic_rate_limit_check RPC failed:', error.message);
    }
    // Fail open on RPC error to avoid blocking legitimate requests
    return { blocked: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { blocked: false };

  return row.blocked
    ? { blocked: true, cooldown: row.cooldown_secs ?? 60 }
    : { blocked: false };
}
