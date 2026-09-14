import { createFileRoute } from '@tanstack/react-router'
import { TermsOfServiceClient } from '@/app/terms-of-service/terms-of-service-client'
import { absoluteUrl } from '@/lib/seo/site-url'

export const Route = createFileRoute('/terms-of-service')({
  head: () => ({
    meta: [
      { title: 'Terms of Service' },
      {
        name: 'description',
        content:
          'Syarat Layanan VibeDev ID yang mengatur penggunaan akun, kontribusi konten, moderasi, dan ketentuan hukum platform komunitas.',
      },
      { property: 'og:url', content: absoluteUrl('/terms-of-service') },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/terms-of-service') }],
  }),
  component: TermsOfServiceRoute,
})

function TermsOfServiceRoute() {
  return <TermsOfServiceClient />
}
