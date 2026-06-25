import type { NextRequest } from 'next/server'

export function getClientIp(request: NextRequest): string {
  const reqIp = (request as Request & { ip?: string }).ip
  if (reqIp) return reqIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
