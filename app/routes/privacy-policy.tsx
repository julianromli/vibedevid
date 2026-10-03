import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicyClient } from '@/app/privacy-policy/privacy-policy-client'
import { publicPageHead } from '@/lib/seo/page-meta'

export const Route = createFileRoute('/privacy-policy')({
  head: () =>
    publicPageHead({
      title: 'Kebijakan Privasi | VibeDev ID',
      description:
        'Kebijakan Privasi VibeDev ID untuk menjelaskan pengumpulan, penggunaan, perlindungan, dan hak pengguna atas data pribadi.',
      path: '/privacy-policy',
    }),
  component: PrivacyPolicyRoute,
})

function PrivacyPolicyRoute() {
  return <PrivacyPolicyClient />
}
