import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // First try to get locale from requestLocale (URL-based routing)
  let locale = await requestLocale

  // If no locale from URL, check cookie
  if (!locale || !routing.locales.includes(locale as 'id' | 'en')) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    if (cookieLocale && routing.locales.includes(cookieLocale as 'id' | 'en')) {
      locale = cookieLocale
    } else {
      locale = routing.defaultLocale
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
