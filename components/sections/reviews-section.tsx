/**
 * Reviews Section Component
 * Displays testimonials from community members
 */

'use client'

import { lazy, Suspense } from 'react'
import type { Testimonial } from '@/types/homepage'

// Lazy load TestimonialsColumns component
const TestimonialsColumns = lazy(() =>
  import('@/components/ui/testimonials-columns').then((module) => ({
    default: module.TestimonialsColumns,
  })),
)

// Hardcoded testimonials data
const testimonials: Testimonial[] = [
  {
    text: 'VibeDev ID ngubah cara gue belajar coding! Dari yang tadinya stuck sendirian, sekarang punya temen-temen yang solid buat diskusi dan kolaborasi project. Networking di sini top banget!',
    image: 'https://github.com/shadcn.png',
    name: 'Rizki Pratama',
    role: 'Frontend Developer, Tokopedia',
  },
  {
    text: 'Komunitas yang benar-benar supportive! Gue berhasil launch startup fintech pertama gue berkat feedback dan mentorship dari senior developer di VibeDev ID. Game changer banget!',
    image: '/professional-woman-dark-hair.png',
    name: 'Sari Indrawati',
    role: 'Founder, PayKita',
  },
  {
    text: 'Sebagai fresh graduate, VibeDev ID kasih gue exposure ke real-world projects dan code review yang berkualitas. Sekarang gue udah confident kerja di tech company besar.',
    image: '/blonde-woman-glasses.png',
    name: 'Amanda Putri',
    role: 'Backend Developer, Gojek',
  },
  {
    text: 'Project showcase di VibeDev ID jadi portfolio terbaik gue. Banyak recruiter yang approach gue setelah liat karya-karya yang gue share di platform ini.',
    image: '/asian-man-short-hair.png',
    name: 'Budi Santoso',
    role: 'Full Stack Developer, Bukalapak',
  },
  {
    text: 'Dari hobby project jadi bisnis yang profitable! Kolaborasi sama member VibeDev ID bikin gue nemuin co-founder yang tepat dan sekarang startup kami udah dapetin seed funding.',
    image: 'https://github.com/shadcn.png',
    name: 'Dimas Ardiansyah',
    role: 'CTO, EduTech Solutions',
  },
  {
    text: 'Workshop dan tech talk di VibeDev ID selalu update dengan teknologi terbaru. Gue bisa ngikutin trend React, Next.js, sampai AI development berkat komunitas ini.',
    image: 'https://github.com/shadcn.png',
    name: 'Maya Sari',
    role: 'Senior React Developer, Traveloka',
  },
]

export function ReviewsSection() {
  return (
    <section id="reviews" className="bg-muted/20 py-20" data-animate>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            Review Member Komunitas Vibe Coding
          </h2>
          <p className="text-muted-foreground text-xl">
            Testimoni asli dari developer Indonesia yang udah join komunitas
            kami
          </p>
        </div>

        <div className="flex max-h-[600px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <Suspense
            fallback={
              <div className="flex justify-center gap-6">
                <div className="flex flex-col space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/20 w-80 animate-pulse rounded-lg p-4"
                    >
                      <div className="bg-muted/30 mb-3 h-20 rounded"></div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted/30 h-10 w-10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-muted/30 h-4 w-3/4 rounded"></div>
                          <div className="bg-muted/20 h-3 w-1/2 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <TestimonialsColumns
              testimonials={testimonials.slice(0, 3)}
              duration={15}
            />
            <TestimonialsColumns
              testimonials={testimonials.slice(3, 6)}
              className="hidden md:block"
              duration={19}
            />
            <TestimonialsColumns
              testimonials={testimonials.slice(6, 9)}
              className="hidden lg:block"
              duration={17}
            />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
