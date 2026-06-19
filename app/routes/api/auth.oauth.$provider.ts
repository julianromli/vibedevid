import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/server'

const allowedProviders = new Set(['google', 'github'])

export const Route = createFileRoute('/api/auth/oauth/$provider')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const provider = params.provider

        if (!allowedProviders.has(provider)) {
          return new Response('Invalid provider', { status: 400 })
        }

        const { origin } = new URL(request.url)
        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as 'google' | 'github',
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        })

        if (error || !data.url) {
          const errorUrl = new URL('/user/auth', request.url)
          errorUrl.searchParams.set('error', error?.message ?? 'OAuth sign-in failed')
          return Response.redirect(errorUrl, 302)
        }

        return Response.redirect(data.url, 302)
      },
    },
  },
})
