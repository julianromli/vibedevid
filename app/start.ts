import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import {
  applyAuthMiddleware,
  applyCanonicalHostRedirect,
  applyLocaleMiddleware,
  shouldSkipRequestMiddleware,
  withResponseCookies,
} from '@/lib/server/request-middleware'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

const canonicalHostMiddleware = createMiddleware().server(async ({ request, next }) => {
  const redirect = applyCanonicalHostRedirect(request)
  if (redirect) return redirect
  return next()
})

const localeAndAuthMiddleware = createMiddleware().server(async ({ request, pathname, next }) => {
  if (shouldSkipRequestMiddleware(pathname)) {
    return next()
  }

  const localeResult = await applyLocaleMiddleware(request, pathname)
  if (localeResult instanceof Response) {
    return localeResult
  }

  const authResult = await applyAuthMiddleware(request, localeResult.pathname, localeResult.localeCookies)
  if (authResult instanceof Response) {
    return authResult
  }

  const result = await next()
  return {
    ...result,
    response: withResponseCookies(result.response, authResult.cookies),
  }
})

export const startInstance = createStart(() => ({
  requestMiddleware: [canonicalHostMiddleware, csrfMiddleware, localeAndAuthMiddleware],
}))
