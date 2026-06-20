import { createServerClient } from '@supabase/ssr'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth-check')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Lazily import the server-only cookie helpers to keep this route
        // module's top level client-safe (it is referenced by the client route
        // tree). `@tanstack/react-start/server` pulls in `react-dom/server`.
        const { getCookies, setCookie } = await import('@tanstack/react-start/server')

        const { searchParams } = new URL(request.url)
        const rawRedirectTo = searchParams.get('redirectTo') || '/blog/editor'

        // Prevent open redirects: only allow local, single-leading-slash paths.
        // Reject protocol-relative (`//host`), backslash, and absolute URLs.
        const isSafeLocalPath =
          rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//') && !rawRedirectTo.startsWith('/\\')
        const redirectTo = isSafeLocalPath ? rawRedirectTo : '/blog/editor'

        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
              },
              setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                  setCookie(name, value, options)
                }
              },
            },
          },
        )

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return Response.redirect(new URL(`/user/auth?redirectTo=${encodeURIComponent(redirectTo)}`, request.url), 302)
        }

        return Response.redirect(new URL(redirectTo, request.url), 302)
      },
    },
  },
})
