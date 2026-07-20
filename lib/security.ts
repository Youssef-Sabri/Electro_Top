import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { devLog } from '@/lib/utils/misc';

// Browser fingerprint generation for rate limiting
export function generateFingerprint(request: Request): string {
  const components: string[] = [];
  
  // User-Agent
  const ua = request.headers.get('user-agent') || '';
  components.push(ua);
  
  // Accept-Language
  const lang = request.headers.get('accept-language') || '';
  components.push(lang);
  
  // Accept-Encoding
  const encoding = request.headers.get('accept-encoding') || '';
  components.push(encoding);
  
  // Sec-CH-UA headers (client hints)
  const chUa = request.headers.get('sec-ch-ua') || '';
  components.push(chUa);
  
  const chUaPlatform = request.headers.get('sec-ch-ua-platform') || '';
  components.push(chUaPlatform);
  
  // Create a simple hash from the components
  const fingerprint = components.join('|');
  
  // Use crypto.subtle for consistent hashing
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `fp-${Math.abs(hash).toString(36)}`;
}

// CSRF Origin / Referrer validation
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const vercelUrl = process.env.VERCEL_URL || '';

  if (!origin && !referer) {
    return false;
  }

  // In development, we allow localhost and local/private network IPs (like 192.168.x.x, 10.x.x.x)
  // to make testing on mobile devices or local network easy.
  if (process.env.NODE_ENV !== 'production') {
    const check = origin || referer || '';
    try {
      const host = new URL(check).hostname;
      const isLocalHost = host === 'localhost' || host === '127.0.0.1';
      const isLanIp = host.startsWith('192.168.') || 
                      host.startsWith('10.') || 
                      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
      
      if (isLocalHost || isLanIp) {
        return true;
      }
    } catch {
      // Fall through to standard validation if URL parsing fails
    }
  }

  // Parse allowed hosts list
  const allowedHosts: string[] = [];
  try {
    if (siteUrl) {
      const parsedHost = new URL(siteUrl).host;
      allowedHosts.push(parsedHost);
    }
  } catch {
    // Ignore URL parsing errors
  }
  if (vercelUrl && vercelUrl.trim()) {
    allowedHosts.push(vercelUrl);
  }

  // Fail closed in production if no allowed host list could be resolved
  if (allowedHosts.length === 0) {
    if (process.env.NODE_ENV === 'production') return false;

    // In development fallback, allow localhost
    const check = origin || referer || '';
    try {
      const host = new URL(check).hostname;
      return host === 'localhost' || host === '127.0.0.1';
    } catch {
      return false;
    }
  }

  try {
    const checkHost = (host: string) => {
      return allowedHosts.some((allowed) => {
        return host === allowed || host === `www.${allowed}` || `www.${host}` === allowed;
      });
    };

    if (origin) {
      const originHost = new URL(origin).host;
      return checkHost(originHost);
    }

    if (referer) {
      const refererHost = new URL(referer).host;
      return checkHost(refererHost);
    }
  } catch {
    return false;
  }

  return false;
}

// Rate limiting types and functions
export interface RateLimitConfig {
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
