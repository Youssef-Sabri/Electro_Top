export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  // If SITE_URL is not configured, use strict mode: both origin and referer are required
  if (!siteUrl) {
    if (!origin && !referer) return false
    return true
  }

  const allowedOrigins = [siteUrl, siteUrl.replace(/\/$/, '')]

  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    return false
  }

  if (referer && !allowedOrigins.some((o) => referer.startsWith(o))) {
    return false
  }

  return true
}
