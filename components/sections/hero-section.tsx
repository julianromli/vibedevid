/**
 * Hero Section Component
 * Homepage hero with animated title, CTA buttons, Safari mockup, and framework tooltips
 */

'use client'

import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Fragment, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { Button } from '@/components/ui/button'
import { LogoMarquee } from '@/components/ui/logo-marquee'
import { ProgressiveImage } from '@/components/ui/progressive-image'
import { SafariMockup } from '@/components/ui/safari-mockup'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

const ANNOUNCEMENT_HREF = 'https://wa.vibedevid.com'
const HERO_WORD_STAGGER_S = 0.06
const HERO_MAX_STAGGER_S = 0.42
const HERO_SUBTITLE_DELAY_S = 0.3

const MotionSpan = motion.span
const MotionP = motion.p
const MotionDiv = motion.div

interface HeroSectionProps {
  joinHref: string
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

function getWordAnimationDelay(index: number): number {
  return Math.min(index * HERO_WORD_STAGGER_S, HERO_MAX_STAGGER_S)
}

export function HeroSection({ joinHref, handleViewShowcase }: HeroSectionProps) {
  const { t } = useTranslation('hero')
  const locale = useLocale()
  const prefersReducedMotion = useReducedMotion()

  // On mobile the Indonesian heading reads best as three balanced lines:
  // "Komunitas" / "Vibe Coding No. 1" / "di Indonesia". This regroups words
  // across the desktop line break, so it needs explicit mobile-only breaks.
  const useIdMobileLayout = locale === 'id'

  const titleLine1Text = t('titleLine1')
  const titleLine2Text = t('titleLine2')
  const titleLine1 = useMemo(() => titleLine1Text.split(' '), [titleLine1Text])
  const titleLine2 = useMemo(() => titleLine2Text.split(' '), [titleLine2Text])
  const titleLine1Items = useMemo(() => buildAnimatedWordItems(titleLine1, 'line1'), [titleLine1])
  const titleLine2Items = useMemo(() => buildAnimatedWordItems(titleLine2, 'line2'), [titleLine2])
  const totalWords = titleLine1.length + titleLine2.length
  const subtitleDelay =
    Math.min(Math.max(totalWords - 1, 0) * HERO_WORD_STAGGER_S, HERO_MAX_STAGGER_S) + HERO_SUBTITLE_DELAY_S

  const wordTransition = (delay: number) => ({
    duration: prefersReducedMotion ? 0 : 0.5,
    delay: prefersReducedMotion ? 0 : delay,
    ease: [0.2, 0, 0, 1] as const,
  })
  const hiddenWord = prefersReducedMotion ? false : { opacity: 0, y: '2rem', filter: 'blur(4px)' }
  const visibleWord = { opacity: 1, y: 0, filter: 'blur(0px)' }

  return (
    <section className="bg-grid-pattern relative mt-0 py-16 sm:py-20 lg:py-28">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-10 sm:space-y-12">
          <div className="space-y-6 text-center sm:space-y-8">
            <a
              href={ANNOUNCEMENT_HREF}
              target="_blank"
              rel="noopener noreferrer"
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
            </a>

            <h1 className="text-foreground text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl sm:leading-[1.05] md:text-6xl lg:text-7xl">
              {titleLine1Items.map((item, index) => (
                <Fragment key={item.key}>
                  <MotionSpan
                    className="mr-2 inline-block sm:mr-3"
                    initial={hiddenWord}
                    animate={visibleWord}
                    transition={wordTransition(getWordAnimationDelay(item.index))}
                  >
                    {item.word}
                  </MotionSpan>
                  {useIdMobileLayout && index === 0 && (
                    <br
                      aria-hidden="true"
                      className="sm:hidden"
                    />
                  )}
                </Fragment>
              ))}
              <br
                aria-hidden="true"
                className={cn(useIdMobileLayout && 'hidden sm:block')}
              />
              {titleLine2Items.map((item, index) => (
                <Fragment key={item.key}>
                  <MotionSpan
                    className="mr-2 inline-block sm:mr-3"
                    initial={hiddenWord}
                    animate={visibleWord}
                    transition={wordTransition(getWordAnimationDelay(item.index + titleLine1.length))}
                  >
                    {item.word}
                  </MotionSpan>
                  {useIdMobileLayout && index === 1 && (
                    <br
                      aria-hidden="true"
                      className="sm:hidden"
                    />
                  )}
                </Fragment>
              ))}
            </h1>

            <MotionP
              className="text-muted-foreground mx-auto max-w-2xl text-center text-lg leading-relaxed md:text-xl"
              initial={hiddenWord}
              animate={visibleWord}
              transition={wordTransition(subtitleDelay)}
            >
              {t('subtitle')}
            </MotionP>

            <MotionDiv
              className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-center"
              initial={hiddenWord}
              animate={visibleWord}
              transition={wordTransition(subtitleDelay + 0.12)}
            >
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              >
                <Link
                  to={joinHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowRight className="h-4 w-4" />
                  {t('joinCommunity')}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="active:scale-[0.98]"
                onClick={handleViewShowcase}
              >
                {t('ourShowcase')}
              </Button>
            </MotionDiv>
          </div>

          <MotionDiv
            className="relative"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.6,
              delay: prefersReducedMotion ? 0 : subtitleDelay + 0.2,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <SafariMockup url="vibedevid.com">
              <ProgressiveImage
                src="/hero-vibedevid-showcase.png"
                alt="VibeDevID showcase interface"
                width={2880}
                height={1800}
                className="h-auto w-full object-cover"
                quality={75}
                responsiveSizes={{
                  mobile: '100vw',
                  tablet: '100vw',
                  desktop: '1200px',
                }}
              />
            </SafariMockup>
          </MotionDiv>

          <MotionDiv
            className="relative mt-12 mb-8"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              delay: prefersReducedMotion ? 0 : subtitleDelay + 0.35,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <div className="my-0 flex items-center justify-center">
              <Suspense fallback={<div className="bg-muted/20 h-12 w-full animate-pulse rounded-lg" />}>
                <LogoMarquee />
              </Suspense>
            </div>
          </MotionDiv>
        </div>
      </div>
    </section>
  )
}
