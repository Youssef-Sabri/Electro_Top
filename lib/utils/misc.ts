import { NextResponse, type NextRequest } from 'next/server';
import { TRACKING_ID_REGEX } from '@/lib/constants';

// Developer logging helper (errors only in dev mode)
export function devLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
}

// Request body JSON parser helper
export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

// Client IP extractor from proxy headers
export function getClientIp(request: NextRequest): string {
  const reqIp = (request as Request & { ip?: string }).ip;
  if (reqIp) return reqIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

// Support phone, WhatsApp, email, and social networks environment extractor
export function getSupportEnv() {
  const sanitize = (val: string) => val.replace(/[^0-9]/g, '');

  return {
    whatsapp: [
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_1,
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_2,
    ].filter((val): val is string => Boolean(val)).map(sanitize),
    phone: [
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_1,
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_2,
    ].filter((val): val is string => Boolean(val)),
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || '',
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  };
}

// Cryptographically secure tracking ID generator starting with ET-
export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < 10; i++) {
    const val = randomBytes[i];
    result += chars[val % chars.length];
  }
  return `ET-${result}`;
}

// Normalize and validate tracking ID format
export function normalizeTrackingId(id: string): string {
  return id.trim().toUpperCase();
}

export function isValidTrackingId(id: string): boolean {
  return TRACKING_ID_REGEX.test(id);
}

// Private IP checks and Google Map safe URL validator
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (isPrivateIp(hostname)) return false;
    
    // Limit to Google Maps domains for safety
    const allowedDomains = ['google.com', 'maps.google.com', 'google.co.uk', 'maps.google.com.eg', 'google.com.eg', 'maps.app.goo.gl', 'goo.gl'];
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function getSafeUrl(url: string | null | undefined): string | null {
  return isSafeUrl(url) ? url : null;
}
