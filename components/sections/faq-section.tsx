/**
 * FAQ Section Component
 * Displays frequently asked questions with accordion functionality
 */

'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'

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
              className={`transition-all duration-700 hover:shadow-md ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full cursor-pointer items-center justify-between p-6"
                  aria-expanded={openFAQ === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <h3 className="text-left font-semibold">{faq.question}</h3>
                  <div className="ml-4 flex-shrink-0 transition-transform duration-300">
                    {openFAQ === index ? (
                      <Minus className="text-muted-foreground h-5 w-5" />
                    ) : (
                      <Plus className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>
                </button>

                <section
                  id={`faq-answer-${index}`}
                  aria-labelledby={`faq-question-${index}`}
                  aria-hidden={openFAQ !== index}
                  className={`overflow-hidden px-6 transition-all duration-500 ease-in-out ${
                    openFAQ === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-muted-foreground text-left leading-relaxed">{faq.answer}</p>
                </section>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
