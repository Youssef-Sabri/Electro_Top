import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const { hostname, port } = request.nextUrl

  // Host header validation — prevents DNS rebinding and host-poisoning attacks.
  // In production, only the canonical domain is allowed.
  if (process.env.NODE_ENV === 'production') {
    const requestHost = request.headers.get('host') || '';
    const expectedHost = port ? `${hostname}:${port}` : hostname;
    if (requestHost !== expectedHost) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // For non-GET requests, validate Origin/Referrer to prevent CSRF
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    if (!origin && !referer) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== request.headers.get('host')) {
          // In development, allow LAN IPs for mobile testing
          if (process.env.NODE_ENV !== 'development' || !originUrl.hostname.startsWith('192.168.')) {
            return new NextResponse('Forbidden', { status: 403 });
          }
        }
      } catch {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  // Allow access to the login page and login API without a session
  if (pathname === '/admin' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createSupabaseServerClient({
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      request.cookies.set(name, value)
      response.cookies.set(name, value, options)
    },
    remove(name: string, options: Record<string, unknown>) {
      request.cookies.set(name, '')
      response.cookies.set(name, '', options)
    },
  })

  // Verify token server-side via getUser() (validates JWT, not just cookie)
  const { data: { user }, error } = await supabase.auth.getUser()
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  // Redirect to /admin login page if token is invalid, expired, no session, or not the admin
  if (error || !user || !adminEmail || user.email !== adminEmail) {
    const url = new URL('/admin', request.url)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

