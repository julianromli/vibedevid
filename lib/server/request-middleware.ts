import { createServerClient } from '@supabase/ssr'
import { serialize, type CookieSerializeOptions } from 'cookie-es'
import { routing, type Locale } from '@/i18n/routing'
import { CONFIRM_EMAIL_COOKIE, CONFIRM_EMAIL_COOKIE_MAX_AGE_SECONDS } from '@/lib/constants/auth'
import { getSupabaseConfig } from '@/lib/env-config'

const LOCALE_COOKIE = 'NEXT_LOCALE'
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type CookieRecord = { name: string; value: string; options?: CookieSerializeOptions }

function parseRequestCookies(request: Request): CookieRecord[] {
  const header = request.headers.get('cookie')
  if (!header) return []

  return header.split(';').flatMap((part) => {
    const trimmed = part.trim()
    if (!trimmed) return []
    const separator = trimmed.indexOf('=')
    if (separator === -1) return []
    const name = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1)
    return [{ name, value: decodeURIComponent(value) }]
  })
}

function getCookieValue(request: Request, name: string): string | undefined {
  return parseRequestCookies(request).find((cookie) => cookie.name === name)?.value
}

function appendSetCookie(headers: Headers, cookie: CookieRecord) {
  headers.append(
    'Set-Cookie',
    serialize(cookie.name, cookie.value, {
      path: '/',
      sameSite: 'lax',
      ...cookie.options,
    }),
  )
}

function mergeCookiesIntoResponse(response: Response, cookies: CookieRecord[]): Response {
  if (cookies.length === 0) return response

  const headers = new Headers(response.headers)
  for (const cookie of cookies) {
    appendSetCookie(headers, cookie)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function createRedirectResponse(url: URL, cookies: CookieRecord[]): Response {
  const headers = new Headers({ Location: url.toString() })
  for (const cookie of cookies) {
    appendSetCookie(headers, cookie)
  }
  return new Response(null, { status: 302, headers })
}

function localeCookie(locale: string): CookieRecord {
  return {
    name: LOCALE_COOKIE,
    value: locale,
    options: { maxAge: LOCALE_COOKIE_MAX_AGE },
  }
}

function getLocaleFromRequest(request: Request, pathname: string): Locale {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale
    }
  }

  const cookieLocale = getCookieValue(request, LOCALE_COOKIE)
  if (cookieLocale && routing.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  const acceptLanguage = request.headers.get('Accept-Language')
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0]
    if (preferredLocale && routing.locales.includes(preferredLocale as Locale)) {
      return preferredLocale as Locale
    }
  }

  return routing.defaultLocale
}

function getSafeRedirectPath(pathname: string | null): string {
  if (!pathname) return '/'

  const trimmed = pathname.trim()
  if (!trimmed.startsWith('/')) return '/'
  if (trimmed.startsWith('//')) return '/'
  if (trimmed.startsWith('/user/auth')) return '/'

  return trimmed
}

export function shouldSkipRequestMiddleware(pathname: string): boolean {
  if (
    pathname.startsWith('/_build') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/node_modules')
  ) {
    return true
  }

  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|map|txt|xml|json)$/i.test(pathname)
}

export async function applyLocaleMiddleware(
  request: Request,
  pathname: string,
): Promise<Response | { localeCookies: CookieRecord[]; pathname: string }> {
  const requestUrl = new URL(request.url)

  if (pathname.startsWith('/en')) {
    const strippedPath = pathname.replace(/^\/en/, '') || '/'
    const redirectUrl = new URL(strippedPath + requestUrl.search + requestUrl.hash, requestUrl.origin)
    return createRedirectResponse(redirectUrl, [localeCookie('en')])
  }

  if (pathname === '/') {
    return { localeCookies: [localeCookie('id')], pathname }
  }

  return {
    localeCookies: [localeCookie(getLocaleFromRequest(request, pathname))],
    pathname,
  }
}

export async function applyAuthMiddleware(
  request: Request,
  pathname: string,
  localeCookies: CookieRecord[],
): Promise<Response | { cookies: CookieRecord[] }> {
  const pendingCookies: CookieRecord[] = [...localeCookies]

  try {
    const { url, anonKey } = getSupabaseConfig()
    const requestUrl = new URL(request.url)

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return parseRequestCookies(request).map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            pendingCookies.push({ name, value, options })
          }
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthPath = pathname.startsWith('/user/auth')
    const isConfirmEmailPath = pathname.includes('/confirm-email')
    const isCallbackPath = pathname.includes('/auth/callback')
    const hasConfirmEmailCookie = Boolean(getCookieValue(request, CONFIRM_EMAIL_COOKIE))

    if (user && isAuthPath && !isConfirmEmailPath && !isCallbackPath) {
      const redirectTo = getSafeRedirectPath(requestUrl.searchParams.get('redirectTo'))
      return createRedirectResponse(new URL(redirectTo, requestUrl.origin), pendingCookies)
    }

    if (user && !user.email_confirmed_at && !isAuthPath && !isCallbackPath) {
      const redirectResponse = createRedirectResponse(new URL('/user/auth/confirm-email', requestUrl.origin), [
        ...pendingCookies,
        {
          name: CONFIRM_EMAIL_COOKIE,
          value: encodeURIComponent(user.email || ''),
          options: {
            path: '/user/auth/confirm-email',
            maxAge: CONFIRM_EMAIL_COOKIE_MAX_AGE_SECONDS,
            sameSite: 'lax',
            secure: requestUrl.protocol === 'https:',
          },
        },
      ])

      await supabase.auth.signOut()
      return redirectResponse
    }

    if (user && user.email_confirmed_at && isConfirmEmailPath && !hasConfirmEmailCookie) {
      return createRedirectResponse(new URL('/', requestUrl.origin), pendingCookies)
    }
  } catch (error) {
    console.error('[request-middleware] auth error:', error)
  }

  return { cookies: pendingCookies }
}

export function withResponseCookies(response: Response, cookies: CookieRecord[]): Response {
  return mergeCookiesIntoResponse(response, cookies)
}
