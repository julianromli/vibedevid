import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicyClient } from '@/app/privacy-policy/privacy-policy-client'
import { absoluteUrl } from '@/lib/seo/site-url'

export const Route = createFileRoute('/privacy-policy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy' },
      {
        name: 'description',
        content:
          'Kebijakan Privasi VibeDev ID untuk menjelaskan pengumpulan, penggunaan, perlindungan, dan hak pengguna atas data pribadi.',
      },
      { property: 'og:url', content: absoluteUrl('/privacy-policy') },
    ],
    links: [{ rel: 'canonical', href: absoluteUrl('/privacy-policy') }],
  }),
  component: PrivacyPolicyRoute,
})

function PrivacyPolicyRoute() {
  return <PrivacyPolicyClient />
}
