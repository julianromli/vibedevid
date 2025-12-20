/**
 * CTA Section Component
 * Call-to-action section with floating project cards animation
 */

'use client'

import { Button } from '@/components/ui/button'

interface CTASectionProps {
  currentTime: string
  isMounted: boolean
  handleJoinWithUs: () => void
}

export function CTASection({ currentTime, isMounted, handleJoinWithUs }: CTASectionProps) {
  return (
    <section
      className="bg-muted text-foreground relative overflow-hidden py-32"
      data-animate
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
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
        {/* Top Row */}
        <div className="bg-card/20 border-border/20 absolute top-16 left-16 h-24 w-32 rotate-12 transform animate-pulse rounded-lg border backdrop-blur-sm">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-2/3 rounded"></div>
          </div>
        </div>

        <div className="bg-card/20 border-border/20 absolute top-20 right-20 h-20 w-28 -rotate-6 transform animate-pulse rounded-lg border backdrop-blur-sm delay-300">
          <div className="p-2">
            <div className="bg-muted-foreground/20 mb-1 h-2 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-3/4 rounded"></div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="bg-card/20 border-border/20 absolute top-1/2 left-8 h-28 w-36 rotate-6 transform animate-pulse rounded-lg border backdrop-blur-sm delay-500">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-4 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-1/2 rounded"></div>
          </div>
        </div>

        <div className="bg-card/20 border-border/20 absolute top-1/2 right-12 h-24 w-32 -rotate-12 transform animate-pulse rounded-lg border backdrop-blur-sm delay-700">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-4/5 rounded"></div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bg-card/20 border-border/20 absolute bottom-16 left-24 h-22 w-30 rotate-3 transform animate-pulse rounded-lg border backdrop-blur-sm delay-1000">
          <div className="p-2">
            <div className="bg-muted-foreground/20 mb-1 h-2 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-2/3 rounded"></div>
          </div>
        </div>

        <div className="bg-card/20 border-border/20 absolute right-16 bottom-20 h-26 w-34 -rotate-8 transform animate-pulse rounded-lg border backdrop-blur-sm delay-1200">
          <div className="p-3">
            <div className="bg-muted-foreground/20 mb-2 h-3 w-full rounded"></div>
            <div className="bg-muted-foreground/15 h-2 w-3/4 rounded"></div>
          </div>
        </div>

        {/* Additional floating elements */}
        <div className="bg-card/20 border-border/20 absolute top-32 left-1/3 h-18 w-24 rotate-45 transform animate-pulse rounded-lg border backdrop-blur-sm delay-200"></div>
        <div className="bg-card/20 border-border/20 absolute right-1/3 bottom-32 h-20 w-28 -rotate-30 transform animate-pulse rounded-lg border backdrop-blur-sm delay-800"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-muted-foreground mb-4 font-mono text-sm tracking-wider">
            {isMounted ? currentTime : '--:--:--'}
          </p>
          <h2 className="mb-6 text-5xl leading-tight font-bold tracking-tight lg:text-6xl">
            Siap Jadi Bagian
            <br />
            <span className="dark:from-primary dark:via-accent-foreground dark:to-primary bg-gradient-to-r from-slate-800 via-slate-600 to-slate-900 bg-clip-text font-extrabold text-transparent">
              Komunitas Vibe Coding Indonesia?
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl leading-relaxed">
            Join sekarang dan nikmatin vibe coding terbaik bareng developer Indonesia lainnya. Gratis, supportive, dan
            penuh kolaborasi!
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleJoinWithUs}
          >
            Gabung Vibe Dev ID Sekarang
          </Button>
        </div>
      </div>
    </section>
  )
}
