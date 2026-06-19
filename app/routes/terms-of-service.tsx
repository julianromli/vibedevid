import { createFileRoute } from '@tanstack/react-router'
import { TermsOfServiceClient } from '@/app/terms-of-service/terms-of-service-client'

export const Route = createFileRoute('/terms-of-service')({
  head: () => ({
    meta: [
      { title: 'Terms of Service' },
      {
        name: 'description',
        content:
          'Syarat Layanan VibeDev ID yang mengatur penggunaan akun, kontribusi konten, moderasi, dan ketentuan hukum platform komunitas.',
      },
    ],
  }),
  component: TermsOfServiceRoute,
})

function TermsOfServiceRoute() {
  return <TermsOfServiceClient />
}
