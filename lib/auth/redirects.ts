import type { AuthCredentialsResult } from '@/lib/auth/credentials'
import { getSafeRedirectPath } from '@/lib/auth/credentials'

function authPageUrl(request: Request, params: Record<string, string | undefined> = {}) {
  const url = new URL('/user/auth', request.url)

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

export function redirectFromAuthResult(request: Request, formData: FormData, result: AuthCredentialsResult) {
  const redirectTo = getSafeRedirectPath(formData.get('redirectTo'))
  const mode = formData.get('mode')?.toString()

  if (result.ok) {
    return Response.redirect(new URL(result.redirect, request.url), 302)
  }

  if (result.emailNotConfirmed && result.email) {
    return Response.redirect(
      new URL(`/user/auth/confirm-email?email=${encodeURIComponent(result.email)}`, request.url),
      302,
    )
  }

  const url = authPageUrl(request, {
    error: result.error,
    redirectTo: redirectTo !== '/' ? redirectTo : undefined,
    mode: mode === 'signup' ? 'signup' : mode === 'reset' ? 'reset' : undefined,
  })

  return Response.redirect(url, 302)
}
