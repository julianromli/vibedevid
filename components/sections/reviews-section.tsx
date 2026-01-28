/**
 * Reviews Section Component
 * Displays testimonials from community members
 */

'use client'

import { useTranslations } from 'next-intl'
import { lazy, Suspense } from 'react'
import type { Testimonial } from '@/types/homepage'

// Lazy load TestimonialsColumns component
const TestimonialsColumns = lazy(() =>
  import('@/components/ui/testimonials-columns').then((module) => ({
    default: module.TestimonialsColumns,
  })),
)

export function ReviewsSection() {
  const t = useTranslations('reviews')
  const testimonialsRaw = t.raw('testimonials') as Record<string, { text: string; name: string; role: string }>

  // Convert translations to Testimonial array with images
  const images = [
    'https://github.com/shadcn.png',
    '/professional-woman-dark-hair.png',
    '/blonde-woman-glasses.png',
    '/asian-man-short-hair.png',
    'https://github.com/shadcn.png',
    'https://github.com/shadcn.png',
  ]

  const testimonials: Testimonial[] = Object.values(testimonialsRaw).map((item, index) => ({
    text: item.text,
    image: images[index],
    name: item.name,
    role: item.role,
  }))

  return (
    <section
      id="reviews"
      className="bg-muted/20 py-20"
      data-animate
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground text-xl">{t('subtitle')}</p>
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
