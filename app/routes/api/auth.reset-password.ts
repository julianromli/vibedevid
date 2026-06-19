import { createFileRoute } from '@tanstack/react-router'
import { resetPasswordWithEmail } from '@/lib/auth/credentials'
import { redirectFromAuthResult } from '@/lib/auth/redirects'

export const Route = createFileRoute('/api/auth/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const { origin } = new URL(request.url)
        const result = await resetPasswordWithEmail(formData, origin)
        return redirectFromAuthResult(request, formData, result)
      },
    },
  },
})
