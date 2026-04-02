/**
 * FAQ Section Component
 * Displays frequently asked questions with accordion functionality
 */

'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { useMediaQuery } from '@/hooks/use-media-query'

interface FAQSectionProps {
  openFAQ: number | null
  toggleFAQ: (index: number) => void
  isVisible: boolean
}

interface FAQItem {
  question: string
  answer: string
}

export function FAQSection({ openFAQ, toggleFAQ, isVisible }: FAQSectionProps) {
  const t = useTranslations('faq')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Get FAQ items from translations
  const faqItems = t.raw('items') as Record<string, FAQItem>
  const faqArray = Object.values(faqItems)

  return (
    <section
      id="faq"
      className="py-20"
      data-animate
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground text-xl">{t('subtitle')}</p>
        </div>

        <div className="space-y-4">
          {faqArray.map((faq, index) => (
            <Card
              key={faq.question}
              className={`hover:shadow-md ${prefersReducedMotion ? '' : 'transition-all duration-700'} ${
                isVisible || prefersReducedMotion ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={prefersReducedMotion ? undefined : { transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={openFAQ === index}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                  >
                    <span className="font-semibold">{faq.question}</span>
                    <div
                      className={`ml-4 flex-shrink-0 ${prefersReducedMotion ? '' : 'transition-transform duration-300'}`}
                    >
                      {openFAQ === index ? (
                        <Minus className="text-muted-foreground h-5 w-5" />
                      ) : (
                        <Plus className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  aria-hidden={openFAQ !== index}
                  className={`overflow-hidden ${prefersReducedMotion ? '' : 'transition-all duration-500 ease-in-out'} ${
                    openFAQ === index ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-muted-foreground text-left leading-relaxed">{faq.answer}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
