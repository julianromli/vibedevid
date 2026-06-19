import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPolicyClient } from '@/app/privacy-policy/privacy-policy-client'

export const Route = createFileRoute('/privacy-policy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy' },
      {
        name: 'description',
        content:
          'Kebijakan Privasi VibeDev ID untuk menjelaskan pengumpulan, penggunaan, perlindungan, dan hak pengguna atas data pribadi.',
      },
    ],
  }),
  component: PrivacyPolicyRoute,
})

function PrivacyPolicyRoute() {
  return <PrivacyPolicyClient />
}
