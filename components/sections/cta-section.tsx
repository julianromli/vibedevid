/**
 * CTA Section Component
 * Call-to-action section with floating project cards animation
 */

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface CTASectionProps {
  joinHref: string
}

export function CTASection({ joinHref }: CTASectionProps) {
  const t = useTranslations('cta')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

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
        <div
          className={cn(
            'bg-card/20 border-border/20 absolute top-20 left-10 h-20 w-28 rotate-6 transform rounded-lg border backdrop-blur-sm',
            !prefersReducedMotion && 'animate-pulse',
          )}
        >
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-2/3 rounded"></div>
          </div>
        </div>

        <div
          className={cn(
            'bg-card/20 border-border/20 absolute top-16 right-12 h-20 w-28 -rotate-6 transform rounded-lg border backdrop-blur-sm',
            !prefersReducedMotion && 'animate-pulse delay-300',
          )}
        >
          <div className="p-2">
            <div className="bg-muted-foreground/20 mb-1 h-2 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-3/4 rounded"></div>
          </div>
        </div>

        <div
          className={cn(
            'bg-card/20 border-border/20 absolute right-1/4 bottom-16 h-20 w-28 -rotate-3 transform rounded-lg border backdrop-blur-sm',
            !prefersReducedMotion && 'animate-pulse delay-500',
          )}
        >
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
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link
              href={joinHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('button')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
