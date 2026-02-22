/**
 * CTA Section Component
 * Call-to-action section with floating project cards animation
 */

'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  handleJoinWithUs: () => void
}

export function CTASection({ handleJoinWithUs }: CTASectionProps) {
  const t = useTranslations('cta')

  return (
    <section
      className="bg-muted text-foreground relative overflow-hidden py-32"
      data-animate
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="from-background via-muted to-card absolute inset-0 bg-gradient-to-br"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              hsl(var(--border) / 0.1) 2px,
              hsl(var(--border) / 0.1) 4px
            )`,
          }}
        ></div>
      </div>

      {/* Floating Project Cards */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-card/20 border-border/20 absolute top-20 left-10 h-20 w-28 rotate-6 transform animate-pulse rounded-lg border backdrop-blur-sm">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-2/3 rounded"></div>
          </div>
        </div>

        <div className="bg-card/20 border-border/20 absolute top-16 right-12 h-20 w-28 -rotate-6 transform animate-pulse rounded-lg border backdrop-blur-sm delay-300">
          <div className="p-2">
            <div className="bg-muted-foreground/20 mb-1 h-2 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-3/4 rounded"></div>
          </div>
        </div>

        <div className="bg-card/20 border-border/20 absolute right-1/4 bottom-16 h-20 w-28 -rotate-3 transform animate-pulse rounded-lg border backdrop-blur-sm delay-500">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-1/2 rounded"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="mb-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t('titleLine1')}
            <br />
            <span className="from-foreground via-foreground/80 to-foreground bg-gradient-to-r bg-clip-text font-extrabold text-transparent dark:from-primary dark:via-primary/80 dark:to-primary">
              {t('titleLine2')}
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed sm:text-xl">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleJoinWithUs}
          >
            {t('button')}
          </Button>
        </div>
      </div>
    </section>
  )
}
