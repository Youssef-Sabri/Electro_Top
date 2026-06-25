import type { NextRequest } from 'next/server'

/**
 * Extracts the client IP from a Next.js request.
 *
 * Trust model:
 * - On Vercel, `request.ip` is the reliable source (Vercel sets it from the
 *   cloudflare-connecting-ip / true-client-ip edge header before proxying).
 * - `x-real-ip` is a fallback for self-hosted behind nginx/caddy.
 * - `x-forwarded-for` is the least trusted — the *first* IP in the chain is
 *   the original client only if you trust every proxy in the chain. On Vercel,
 *   Vercel's edge network is the first hop, so `forwarded.split(',')[0]` is
 *   reliable. In other environments, validate against a known proxy list.
 */
export function getClientIp(request: NextRequest): string {
  const reqIp = (request as { ip?: string }).ip
  if (reqIp) return reqIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
