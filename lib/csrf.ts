export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!siteUrl) return true

  const allowedOrigins = [siteUrl, siteUrl.replace(/\/$/, '')]

  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    return false
  }

  if (referer && !allowedOrigins.some((o) => referer.startsWith(o))) {
    return false
  }

  return true
}
