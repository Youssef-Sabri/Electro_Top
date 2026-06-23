export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!origin && !referer) {
    return false
  }

  if (!siteUrl) {
    return true
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

