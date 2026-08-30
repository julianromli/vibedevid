import { createFileRoute } from '@tanstack/react-router'
import TermsPage from '@/app/terms/page'
import { absoluteUrl } from '@/lib/seo/site-url'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Ketentuan Layanan | VibeDev ID' },
      {
        name: 'description',
        content:
          'Ketentuan layanan VibeDev ID — komunitas vibe coding Indonesia. Syarat dan ketentuan penggunaan platform.',
      },
      { name: 'robots', content: 'index, follow' },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/terms') }],
  }),
  component: TermsRoute,
})

function TermsRoute() {
  return <TermsPage />
}
