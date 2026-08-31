import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Nepalora Auth Middleware
 * - Protects all /staff/* routes except /staff/login
 * - Unauthenticated requests are redirected to /staff/login
 * - Authenticated users visiting /staff/login are redirected to /staff/dashboard
 * - Refreshes Supabase session cookies on every request
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (required for Server Components to read auth state)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow public access to login page
  if (pathname === '/staff/login') {
    // If already authenticated, redirect to dashboard
    if (user) {
      return NextResponse.redirect(new URL('/staff/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Protect all other /staff/* routes
  if (pathname.startsWith('/staff')) {
    if (!user) {
      const loginUrl = new URL('/staff/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match /staff/* routes for auth guard.
     * Exclude Next.js internals and static files.
     */
    '/staff/:path*',
  ],
}
