export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const vercelUrl = process.env.VERCEL_URL || ''

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

  // Parse allowed hosts list
  const allowedHosts: string[] = []
  try {
    if (siteUrl) {
      const parsedHost = new URL(siteUrl).host
      allowedHosts.push(parsedHost)
    }
  } catch {
    // Ignore URL parsing errors
  }
  if (vercelUrl) {
    allowedHosts.push(vercelUrl)
  }

  // Fail closed in production if no allowed host list could be resolved
  if (allowedHosts.length === 0) {
    if (process.env.NODE_ENV === 'production') return false

    // In development fallback, allow localhost
    const check = origin || referer || ''
    try {
      const host = new URL(check).hostname
      return host === 'localhost' || host === '127.0.0.1'
    } catch {
      return false
    }
  }

  try {
    const checkHost = (host: string) => {
      return allowedHosts.some((allowed) => {
        return host === allowed || host === `www.${allowed}` || `www.${host}` === allowed
      })
    }

    if (origin) {
      const originHost = new URL(origin).host
      return checkHost(originHost)
    }

    if (referer) {
      const refererHost = new URL(referer).host
      return checkHost(refererHost)
    }
  } catch {
    return false
  }

  return false
}
