import type { Metadata } from 'next'
import { PrivacyPolicyClient } from './privacy-policy-client'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Kebijakan Privasi VibeDev ID untuk menjelaskan pengumpulan, penggunaan, perlindungan, dan hak pengguna atas data pribadi.',
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
