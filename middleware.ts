import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { getSupabaseConfig } from './lib/env-config'

// Detect locale from request
function getLocale(request: NextRequest): string {
  // 1. Check URL for locale prefix
  const pathname = request.nextUrl.pathname
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale
    }
  }

  // 2. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && routing.locales.includes(cookieLocale as 'id' | 'en')) {
    return cookieLocale
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(',')[0].split('-')[0]
    if (routing.locales.includes(preferredLocale as 'id' | 'en')) {
      return preferredLocale
    }
  }

  // 4. Default
  return routing.defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Handle /en route - Strict English
  if (pathname.startsWith('/en')) {
    const newPath = pathname.replace(/^\/en/, '') || '/'
    const url = request.nextUrl.clone()
    url.pathname = newPath

    // Create rewrite response
    const response = NextResponse.rewrite(url)

    // Force EN cookie
    response.cookies.set('NEXT_LOCALE', 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    // Run auth logic on this response
    return handleAuth(request, response)
  }

  // 2. Handle root route - Strict Indonesian
  if (pathname === '/') {
    const response = NextResponse.next({ request })

    // Force ID cookie
    response.cookies.set('NEXT_LOCALE', 'id', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    return handleAuth(request, response)
  }

  // 3. All other routes - Standard behavior
  const response = NextResponse.next({ request })

  // Detect and set locale cookie
  const locale = getLocale(request)
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })

  return handleAuth(request, response)
}

// Extract auth logic to helper to avoid duplication
async function handleAuth(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl

  // Now handle Supabase auth
  try {
    const { url, anonKey } = getSupabaseConfig()
    const requestUrl = new URL(request.url)

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Copy cookies to response
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check for email confirmation requirements
    const isAuthPath = pathname.startsWith('/user/auth')
    const isConfirmEmailPath = pathname.includes('/confirm-email')
    const isCallbackPath = pathname.includes('/auth/callback')

    // If user is logged in but email is not confirmed
    if (user && !user.email_confirmed_at && !isAuthPath && !isCallbackPath) {
      console.log('[Middleware] Redirecting unconfirmed user:', user.email, 'from:', pathname)

      // Sign out unconfirmed user and redirect
      await supabase.auth.signOut()

      return NextResponse.redirect(
        new URL(
          `/user/auth/confirm-email?email=${encodeURIComponent(user.email || '')}&from=${encodeURIComponent(pathname)}`,
          requestUrl.origin,
        ),
      )
    }

    // Prevent confirmed users from accessing confirm-email page unless they have a specific email param
    if (user && user.email_confirmed_at && isConfirmEmailPath && !requestUrl.searchParams.get('email')) {
      console.log('[Middleware] Redirecting confirmed user away from confirm-email page')
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without authentication if there's an error
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
