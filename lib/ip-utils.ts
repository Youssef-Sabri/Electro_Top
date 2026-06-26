import type { NextRequest } from 'next/server'

// IP trust chain (most → least trustworthy):
//  1. request.ip  — set by Vercel's edge network; cannot be spoofed by clients.
//  2. x-real-ip   — set by trusted nginx/proxy at the network edge.
//  3. x-forwarded-for — client-controllable header; only use when 1 & 2 are unavailable
//     (e.g. self-hosted without a trusted proxy). If relying on this in production,
//     configure your proxy to overwrite it rather than append.
export function getClientIp(request: NextRequest): string {
  const reqIp = (request as Request & { ip?: string }).ip
  if (reqIp) return reqIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
