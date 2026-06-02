import type { Context, Next } from 'hono'
import { setCookie } from 'hono/cookie'
import { routing } from '@/i18n/routing'

export async function localeMiddleware(c: Context, next: Next) {
  const pathname = c.req.path

  if (pathname.startsWith('/en')) {
    setCookie(c, 'NEXT_LOCALE', 'en', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' })
  } else if (pathname === '/') {
    setCookie(c, 'NEXT_LOCALE', 'id', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' })
  } else {
    const cookieLocale = c.req.header('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1]
    const locale =
      cookieLocale && routing.locales.includes(cookieLocale as 'id' | 'en') ? cookieLocale : routing.defaultLocale
    setCookie(c, 'NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'Lax' })
  }

  await next()
}
