import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './lib/env-config'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const { url, anonKey } = getSupabaseConfig()
    const requestUrl = new URL(request.url)

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
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
    const isAuthPath = requestUrl.pathname.startsWith('/user/auth')
    const isConfirmEmailPath = requestUrl.pathname.includes('/confirm-email')
    const isCallbackPath = requestUrl.pathname.includes('/auth/callback')

    // If user is logged in but email is not confirmed
    if (user && !user.email_confirmed_at && !isAuthPath && !isCallbackPath) {
      console.log(
        '[Middleware] Redirecting unconfirmed user:',
        user.email,
        'from:',
        requestUrl.pathname,
      )

      // Sign out unconfirmed user and redirect
      await supabase.auth.signOut()

      return NextResponse.redirect(
        new URL(
          `/user/auth/confirm-email?email=${encodeURIComponent(user.email || '')}&from=${encodeURIComponent(requestUrl.pathname)}`,
          requestUrl.origin,
        ),
      )
    }

    // Prevent confirmed users from accessing confirm-email page unless they have a specific email param
    if (
      user &&
      user.email_confirmed_at &&
      isConfirmEmailPath &&
      !requestUrl.searchParams.get('email')
    ) {
      console.log(
        '[Middleware] Redirecting confirmed user away from confirm-email page',
      )
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without authentication if there's an error
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
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
