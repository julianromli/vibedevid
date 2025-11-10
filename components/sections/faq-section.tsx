/**
 * FAQ Section Component
 * Displays frequently asked questions with accordion functionality
 */

'use client'

import Script from 'next/script'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus } from 'lucide-react'
import type { FAQ } from '@/types/homepage'

interface FAQSectionProps {
  openFAQ: number | null
  toggleFAQ: (index: number) => void
  isVisible: boolean
}

// Hardcoded FAQ data
const faqs: FAQ[] = [
  {
    question: 'Apa itu VibeDev ID?',
    answer:
      'VibeDev ID adalah komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators yang punya visi sama untuk bikin produk digital keren. Kami menghubungkan vibe coder Indonesia yang sepikiran untuk kolaborasi, belajar coding pake AI, dan berkembang bareng.',
  },
  {
    question: 'Gimana cara gabung komunitas vibe coding ini?',
    answer:
      "Gabung komunitas vibe coding Indonesia gampang banget! Klik tombol 'Gabung Komunitas Gratis' dan lengkapi profil lo. Kami welcome developer dari semua level - dari pemula yang baru belajar coding pake AI sampai professional berpengalaman.",
  },
  {
    question: 'Ada biaya untuk join komunitas vibe coding Indonesia?',
    answer:
      'Membership basic di komunitas vibe coding kami 100% gratis! Lo dapet akses ke community forums, project showcases, networking opportunities, dan belajar coding pake AI bareng member lain. Semua fitur inti gratis untuk semua vibe coder Indonesia.',
  },
  {
    question: 'Bisa kolaborasi project dengan member lain?',
    answer:
      'Kolaborasi itu inti dari komunitas vibe coding kami! Lo bisa cari teammates untuk coding pake AI, join project open source yang udah ada, atau mulai project lo sendiri. Banyak vibe coder Indonesia di sini yang udah sukses bikin startup bareng.',
  },
  {
    question: 'Teknologi dan AI tools apa aja yang didukung?',
    answer:
      'Komunitas vibe coding Indonesia kami embrace semua teknologi modern! Member aktif kerja dengan React, Next.js, Python, AI/ML frameworks, dan tools untuk coding pake AI seperti GitHub Copilot, ChatGPT, dan Claude. Kalau itu cutting-edge tech, lo pasti nemu expert vibe coder di sini.',
  },
]

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
            mainEntity: faqs.map((faq) => ({
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

      <section id="faq" className="py-20" data-animate>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              FAQ Komunitas Vibe Coding Indonesia
            </h2>
            <p className="text-muted-foreground text-xl">
              Semua yang perlu lo tau tentang gabung di komunitas vibe coder
              Indonesia terbesar
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-700 hover:shadow-md ${
                  isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-8 opacity-0'
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
                      openFAQ === index
                        ? 'mt-4 max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-muted-foreground text-left leading-relaxed">
                      {faq.answer}
                    </p>
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
