import { createFileRoute } from '@tanstack/react-router'
import { TermsOfServiceClient } from '@/app/terms-of-service/terms-of-service-client'
import { publicPageHead } from '@/lib/seo/page-meta'

export const Route = createFileRoute('/terms-of-service')({
  head: () =>
    publicPageHead({
      title: 'Syarat Layanan | VibeDev ID',
      description:
        'Syarat Layanan VibeDev ID yang mengatur penggunaan akun, kontribusi konten, moderasi, dan ketentuan hukum platform komunitas.',
      path: '/terms-of-service',
    }),
  component: TermsOfServiceRoute,
})

function TermsOfServiceRoute() {
  return <TermsOfServiceClient />
}
