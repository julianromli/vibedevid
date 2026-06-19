import { createFileRoute } from '@tanstack/react-router'
import { signUpWithCredentials } from '@/lib/auth/credentials'
import { redirectFromAuthResult } from '@/lib/auth/redirects'

export const Route = createFileRoute('/api/auth/sign-up')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const { origin } = new URL(request.url)
        const result = await signUpWithCredentials(formData, origin)
        return redirectFromAuthResult(request, formData, result)
      },
    },
  },
})
