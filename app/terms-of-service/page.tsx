import type { Metadata } from 'next'
import { TermsOfServiceClient } from './terms-of-service-client'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Syarat Layanan VibeDev ID yang mengatur penggunaan akun, kontribusi konten, moderasi, dan ketentuan hukum platform komunitas.',
}

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />
}
