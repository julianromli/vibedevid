/**
 * FAQ Section Component
 * Displays frequently asked questions with accordion functionality
 */

'use client'

import { Minus, Plus } from 'lucide-react'
import Script from 'next/script'
import { Card, CardContent } from '@/components/ui/card'
import { FAQ_DATA } from '@/lib/constants/faqs'

interface FAQSectionProps {
  openFAQ: number | null
  toggleFAQ: (index: number) => void
  isVisible: boolean
}

export function FAQSection({ openFAQ, toggleFAQ, isVisible }: FAQSectionProps) {
  return (
    <>
      {/* FAQ Schema */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <section
        id="faq"
        className="py-20"
        data-animate
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">FAQ Komunitas Vibe Coding Indonesia</h2>
            <p className="text-muted-foreground text-xl">
              Semua yang perlu lo tau tentang gabung di komunitas vibe coder Indonesia terbesar
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-700 hover:shadow-md ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => toggleFAQ(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left font-semibold">{faq.question}</h3>
                    <div className="ml-4 flex-shrink-0 transition-transform duration-300">
                      {openFAQ === index ? (
                        <Minus className="text-muted-foreground h-5 w-5" />
                      ) : (
                        <Plus className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
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
    </>
  )
}
