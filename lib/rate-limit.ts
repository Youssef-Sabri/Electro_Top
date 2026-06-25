import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitConfig {
  table: string;
  countColumn: string;
  lastColumn: string;
  firstColumn: string;
  maxAttempts: number;
  windowMs: number;
}

interface RateLimitRow {
  [key: string]: unknown;
  ip_address: string;
  attempt_count?: number;
  last_attempt?: string;
  first_attempt?: string;
}

interface RateLimitCheck {
  blocked: boolean;
  cooldown?: number;
  count?: number;
}

export async function checkRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitCheck> {
  const { data } = await client
    .from(config.table)
    .select(`${config.countColumn}, ${config.lastColumn}`)
    .eq('ip_address', ip)
    .single();

  const row = data as RateLimitRow | null;
  if (!row) return { blocked: false };

  const elapsed = Date.now() - new Date(row[config.lastColumn] as string).getTime();
  if (elapsed > config.windowMs) {
    await client.from(config.table).delete().eq('ip_address', ip);
    return { blocked: false };
  }

  const count = row[config.countColumn] as number;
  if (count >= config.maxAttempts) {
    return { blocked: true, cooldown: Math.ceil((config.windowMs - elapsed) / 1000) };
  }

  return { blocked: false, count };
}

export async function incrementRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<number> {
  const { data } = await client
    .from(config.table)
    .select(config.countColumn)
    .eq('ip_address', ip)
    .single();

  const now = new Date().toISOString();

  const row = data as RateLimitRow | null;
  if (!row) {
    await client.from(config.table).insert({
      ip_address: ip,
      [config.countColumn]: 1,
      [config.firstColumn]: now,
      [config.lastColumn]: now,
    });
    return 1;
  }

  const newCount = (row[config.countColumn] as number) + 1;
  const { error } = await client
    .from(config.table)
    .update({ [config.countColumn]: newCount, [config.lastColumn]: now })
    .eq('ip_address', ip);

  if (error && process.env.NODE_ENV !== 'production') {
    console.error(`Rate limit increment failed for ${config.table}:`, error.message);
  }

  return newCount;
}

export async function clearRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<void> {
  await client.from(config.table).delete().eq('ip_address', ip);
}

export async function checkAndIncrementRateLimit(
  client: SupabaseClient,
  ip: string,
  config: RateLimitConfig
): Promise<{ blocked: boolean; cooldown?: number }> {
  const check = await checkRateLimit(client, ip, config);
  if (check.blocked) return { blocked: true, cooldown: check.cooldown };

  await incrementRateLimit(client, ip, config);
  return { blocked: false };
}
