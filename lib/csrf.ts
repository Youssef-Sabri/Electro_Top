export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!origin && !referer) {
    return false
  }

  // In development, we allow localhost and local/private network IPs (like 192.168.x.x, 10.x.x.x)
  // to make testing on mobile devices or local network easy.
  if (process.env.NODE_ENV !== 'production') {
    const check = origin || referer || ''
    try {
      const host = new URL(check).hostname
      const isLocalHost = host === 'localhost' || host === '127.0.0.1'
      const isLanIp = host.startsWith('192.168.') || 
                      host.startsWith('10.') || 
                      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      
      if (isLocalHost || isLanIp) {
        return true
      }
    } catch {
      // Fall through to standard validation if URL parsing fails
    }
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
      return originHost === allowedHost || originHost === `www.${allowedHost}` || `www.${originHost}` === allowedHost
    }

    if (referer) {
      const refererHost = new URL(referer).host
      return refererHost === allowedHost || refererHost === `www.${allowedHost}` || `www.${refererHost}` === allowedHost
    }
  } catch {
    return false
  }

  return false
}
