/**
 * FAQ Section Component
 * Displays frequently asked questions with accordion functionality
 */

'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

export function FAQSection() {
  const { t } = useTranslation('faq')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const faqItems = t('items', { returnObjects: true }) as Record<string, FAQItem>
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
            <details
              key={faq.question}
              className={cn(
                'faq-card bg-card text-card-foreground group rounded-xl border shadow-sm hover:shadow-md',
                !prefersReducedMotion && 'transition-shadow duration-300',
              )}
              style={prefersReducedMotion ? undefined : { animationDelay: `${index * 100}ms` }}
            >
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center justify-between p-6 text-left font-semibold [&::-webkit-details-marker]:hidden',
                  !prefersReducedMotion && 'transition-colors duration-200',
                )}
              >
                <span className="pr-4">{faq.question}</span>
                <span className="ml-4 flex-shrink-0" aria-hidden="true">
                  <Plus className="text-muted-foreground h-5 w-5 group-open:hidden" />
                  <Minus className="text-muted-foreground hidden h-5 w-5 group-open:block" />
                </span>
              </summary>

              <div className="px-6 pb-6">
                <p className="text-muted-foreground text-left leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
