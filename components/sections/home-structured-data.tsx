/**
 * FAQPage JSON-LD for the homepage.
 * Questions and answers come from the same i18n catalog as the visible FAQ.
 */

import { useTranslation } from 'react-i18next'

interface FaqItem {
  question: string
  answer: string
}

export function HomeStructuredData() {
  const { t } = useTranslation('faq')
  const faqItems = t('items', { returnObjects: true }) as Record<string, FaqItem>
  const faqs = Object.values(faqItems).filter((item): item is FaqItem =>
    Boolean(item && typeof item.question === 'string' && item.answer),
  )

  if (faqs.length === 0) return null

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
}
