import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSupabaseHostname } from '@/lib/supabase-url'
import { validateRequestOrigin } from '@/lib/csrf'

function getExpectedHost(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return null
  try {
    const parsed = new URL(siteUrl)
    return parsed.host
  } catch {
    return null
  }
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildCsp(nonce: string, supabaseHost: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const evalSrc = isDev ? " 'unsafe-eval'" : ""

  const scriptSrc = `script-src 'self' 'nonce-${nonce}'${evalSrc}`

  return [
    `default-src 'self'`,
    scriptSrc,
    `worker-src 'self' blob:`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://${supabaseHost}`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `report-uri /api/csp-report`,
  ].join('; ')
}

const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024 // 10 MB

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supabaseHost = getSupabaseHostname()
  const nonce = generateNonce()

  if (process.env.NODE_ENV === 'production') {
    const requestHost = request.headers.get('host') || '';
    const expectedHost = getExpectedHost();
    const vercelUrl = process.env.VERCEL_URL || '';
    const isAllowed = (!expectedHost || requestHost === expectedHost || requestHost === `www.${expectedHost}`) || 
                      (vercelUrl && requestHost === vercelUrl);
    if (!isAllowed) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // For non-GET requests, validate Origin/Referrer to prevent CSRF
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (!validateRequestOrigin(request)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Reject oversized request bodies before they reach API handlers
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const bytes = parseInt(contentLength, 10)
      if (!isNaN(bytes) && bytes > MAX_REQUEST_BODY_BYTES) {
        return new NextResponse('Request too large', { status: 413 })
      }
    }
  }

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  // Set CSP header with nonce and pass nonce to Next.js via x-nonce
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })

  // Allow admin login page and API without session
  if (pathname === '/admin' || pathname === '/api/admin/login') {
    response.headers.set('x-nonce', nonce)
    response.headers.set('Content-Security-Policy', buildCsp(nonce, supabaseHost))
    return response
  }

  // Only check admin auth for admin routes
  if (isAdminRoute) {
    const supabase = createSupabaseServerClient({
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        const cookieVal = request.cookies.toString()
        requestHeaders.set('cookie', cookieVal)
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          }
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || user.app_metadata?.role !== 'admin') {
      if (pathname.startsWith('/api/admin/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const url = new URL('/admin', request.url)
      return NextResponse.redirect(url)
    }

    // Inactivity timeout: expire session after 1h of no requests
    const lastActivity = request.cookies.get('admin-last-activity')?.value
    const now = Date.now()

    if (lastActivity) {
      const elapsed = now - parseInt(lastActivity, 10)
      if (elapsed > 3600_000) {
        await supabase.auth.signOut()
        if (pathname.startsWith('/api/admin/')) {
          return NextResponse.json({ error: 'Session expired' }, { status: 401 })
        }
        const url = new URL('/admin', request.url)
        return NextResponse.redirect(url)
      }
    }

    response.cookies.set('admin-last-activity', String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86_400,
    })
  }

  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', buildCsp(nonce, supabaseHost))
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
