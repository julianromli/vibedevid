/**
 * Hero Section Component
 * Homepage hero with animated title, CTA buttons, Safari mockup, and framework tooltips
 */

'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { Button } from '@/components/ui/button'
import { LogoMarquee } from '@/components/ui/logo-marquee'
import { ProgressiveImage } from '@/components/ui/progressive-image'
import { SafariMockup } from '@/components/ui/safari-mockup'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  handleJoinWithUs: () => void
  handleViewShowcase: () => void
}

interface AnimatedWordItem {
  key: string
  word: string
  index: number
}

function buildAnimatedWordItems(words: string[], prefix: string): AnimatedWordItem[] {
  const counts = new Map<string, number>()

  return words.map((word, index) => {
    const count = (counts.get(word) ?? 0) + 1
    counts.set(word, count)

    return {
      key: `${prefix}-${word}-${count}`,
      word,
      index,
    }
  })
}

export function HeroSection({ handleJoinWithUs, handleViewShowcase }: HeroSectionProps) {
  const [animatedWords, setAnimatedWords] = useState<number[]>([])
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const t = useTranslations('hero')

  const titleLine1 = useMemo(() => t('titleLine1').split(' '), [t])
  const titleLine2 = useMemo(() => t('titleLine2').split(' '), [t])
  const titleLine1Items = useMemo(() => buildAnimatedWordItems(titleLine1, 'line1'), [titleLine1])
  const titleLine2Items = useMemo(() => buildAnimatedWordItems(titleLine2, 'line2'), [titleLine2])

  useEffect(() => {
    setAnimatedWords([])
    setSubtitleVisible(false)

    const words = [...titleLine1, ...titleLine2]
    const timers: ReturnType<typeof setTimeout>[] = []

    words.forEach((_word, index) => {
      const timer = setTimeout(() => {
        setAnimatedWords((prev) => [...prev, index])
      }, index * 100)
      timers.push(timer)
    })

    const subtitleTimer = setTimeout(
      () => {
        setSubtitleVisible(true)
      },
      words.length * 100 + 200,
    )
    timers.push(subtitleTimer)

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer)
      })
    }
  }, [titleLine1, titleLine2])

  return (
    <section className="bg-grid-pattern relative mt-0 py-16 sm:py-20 lg:py-28">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-10 sm:space-y-12">
          <div className="space-y-6 text-center sm:space-y-8">
            <Link
              href="/blog"
              className="inline-block cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <AnimatedGradientText className="transition-all duration-300 hover:shadow-[inset_0_-5px_10px_hsl(var(--foreground)/0.15)]">
                <span
                  className={cn(
                    'animate-gradient inline bg-gradient-to-r from-foreground via-foreground/70 to-foreground bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent dark:from-primary dark:via-primary/80 dark:to-primary',
                  )}
                >
                  {t('announcement')}
                </span>
                <span className="text-primary ml-2 font-semibold">{t('readLatest')}</span>
              </AnimatedGradientText>
            </Link>

            <h1 className="text-foreground text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {titleLine1Items.map((item) => (
                <span
                  key={item.key}
                  className={cn(
                    'mr-2 inline-block transition-all duration-700 ease-out sm:mr-3',
                    animatedWords.includes(item.index)
                      ? 'blur-0 translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0 blur-sm',
                  )}
                >
                  {item.word}
                </span>
              ))}
              <br />
              {titleLine2Items.map((item) => (
                <span
                  key={item.key}
                  className={cn(
                    'mr-2 inline-block transition-all duration-700 ease-out sm:mr-3',
                    animatedWords.includes(item.index + titleLine1.length)
                      ? 'blur-0 translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0 blur-sm',
                  )}
                >
                  {item.word}
                </span>
              ))}
            </h1>

            <p
              className={cn(
                'text-muted-foreground mx-auto max-w-2xl text-center text-lg leading-relaxed transition-all duration-700 ease-out md:text-xl',
                subtitleVisible ? 'blur-0 translate-y-0 opacity-100' : 'translate-y-8 opacity-0 blur-sm',
              )}
            >
              {t('subtitle')}
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                onClick={handleJoinWithUs}
              >
                <ArrowRight className="h-4 w-4" />
                {t('joinCommunity')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="active:scale-[0.98]"
                onClick={handleViewShowcase}
              >
                {t('ourShowcase')}
              </Button>
            </div>
          </div>

          <div className="relative">
            <SafariMockup url="vibedevid.com">
              <ProgressiveImage
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SOLO-pic-EN.35a702ba-uLVDZsjReIz7K4Ecr3JBrYkLCl8cdm.png"
                alt="Development environment showing SOLO Builder interface with movie website project documentation"
                width={1200}
                height={675}
                className="h-auto w-full object-cover"
                priority={true}
                enableBlurPlaceholder={true}
                quality={75}
                responsiveSizes={{
                  mobile: '100vw',
                  tablet: '100vw',
                  desktop: '1200px',
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              />
            </SafariMockup>
          </div>

          <div className="relative mt-12 mb-8">
            <div className="my-0 flex items-center justify-center opacity-90">
              <Suspense fallback={<div className="bg-muted/20 h-12 w-full animate-pulse rounded-lg" />}>
                <LogoMarquee />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
