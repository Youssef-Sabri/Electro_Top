export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!origin && !referer) {
    return false
  }

  if (!siteUrl) {
    // Fail closed in production — never allow all origins without an explicit site URL
    if (process.env.NODE_ENV === 'production') return false

    // In development, allow only localhost origins so the dev server works without the var set
    const check = origin || referer || ''
    try {
      const host = new URL(check).hostname
      return host === 'localhost' || host === '127.0.0.1'
    } catch {
      return false
    }
  }

  try {
    const allowedHost = new URL(siteUrl).host

    if (origin) {
      const originHost = new URL(origin).host
      return originHost === allowedHost
    }

    if (referer) {
      const refererHost = new URL(referer).host
      return refererHost === allowedHost
    }
  } catch {
    return false
  }

  return false
}
