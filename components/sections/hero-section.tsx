/**
 * Hero Section Component
 * Homepage hero with animated title, CTA buttons, Safari mockup, and framework tooltips
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { AnimatedTooltip } from '@/components/ui/animated-tooltip'
import { ProgressiveImage } from '@/components/ui/progressive-image'
import { SafariMockup } from '@/components/ui/safari-mockup'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User, Framework } from '@/types/homepage'

interface HeroSectionProps {
  isLoggedIn: boolean
  user?: User
  handleJoinWithUs: () => void
  handleViewShowcase: () => void
}

// Hardcoded frameworks data
const frameworks: Framework[] = [
  {
    id: 1,
    name: 'React',
    designation: '18.3',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  },
  {
    id: 2,
    name: 'Next.js',
    designation: '15.3',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
  },
  {
    id: 3,
    name: 'Vue.js',
    designation: '3.4',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  },
  {
    id: 4,
    name: 'Angular',
    designation: '18.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
  },
  {
    id: 5,
    name: 'Svelte',
    designation: '5.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
  },
  {
    id: 6,
    name: 'Tailwind CSS',
    designation: '4.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
  },
  {
    id: 7,
    name: 'TypeScript',
    designation: '5.6',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  },
  {
    id: 8,
    name: 'Node.js',
    designation: '22.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  },
  {
    id: 9,
    name: 'Express.js',
    designation: '4.19',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
  },
  {
    id: 10,
    name: 'MongoDB',
    designation: '7.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  },
  {
    id: 11,
    name: 'PostgreSQL',
    designation: '16.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
  },
  {
    id: 12,
    name: 'Docker',
    designation: '25.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  },
  {
    id: 13,
    name: 'AWS',
    designation: 'Cloud',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
  },
  {
    id: 14,
    name: 'Firebase',
    designation: '10.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
  },
  {
    id: 15,
    name: 'Vite',
    designation: '5.0',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg',
  },
  {
    id: 16,
    name: 'Figma',
    designation: 'Design',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  },
  {
    id: 17,
    name: 'Vercel',
    designation: 'Deploy',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg',
  },
  {
    id: 18,
    name: 'Git',
    designation: '2.45',
    image:
      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  },
]

export function HeroSection({
  isLoggedIn,
  user,
  handleJoinWithUs,
  handleViewShowcase,
}: HeroSectionProps) {
  const [animatedWords, setAnimatedWords] = useState<number[]>([])
  const [subtitleVisible, setSubtitleVisible] = useState(false)

  // Animated title effect
  useEffect(() => {
    const titlePart1 = ['Komunitas', 'Vibe', 'Coding']
    const titlePart2 = ['No.', '1', 'di', 'Indonesia']
    const words = [...titlePart1, ...titlePart2]

    words.forEach((word, index) => {
      setTimeout(() => {
        setAnimatedWords((prev) => [...prev, index])
      }, index * 100)
    })

    setTimeout(
      () => {
        setSubtitleVisible(true)
      },
      words.length * 100 + 200,
    )
  }, [])

  return (
    <section className="bg-grid-pattern relative mt-0 py-20 lg:py-32">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="space-y-8 text-center">
            <Link
              href="https://vibecoding.id/hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              <AnimatedGradientText className="transition-all duration-300 hover:shadow-[inset_0_-5px_10px_#8fdfff4f]">
                🏆 <hr className="mx-2 h-4 w-px shrink-0 bg-gray-300" />{' '}
                <span
                  className={cn(
                    `animate-gradient inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
                  )}
                >
                  VibeCoding Hackathon 2025 by vibecoding.id
                </span>
                <span className="ml-2 font-semibold text-orange-500">
                  Hadiah 5 JUTA RUPIAH
                </span>
              </AnimatedGradientText>
            </Link>

            <h1 className="text-foreground text-4xl leading-10 leading-tight font-bold tracking-tight md:text-6xl lg:text-7xl xl:text-8xl">
              {['Komunitas', 'Vibe', 'Coding'].map((word, index) => (
                <span
                  key={index}
                  className={`mr-3 inline-block leading-3 transition-all duration-700 ease-out ${
                    animatedWords.includes(index)
                      ? 'blur-0 translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0 blur-sm'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {word}
                </span>
              ))}
              <br />
              {['No.', '1', 'di', 'Indonesia'].map((word, index) => (
                <span
                  key={index + 3}
                  className={`mr-3 inline-block leading-3 transition-all duration-700 ease-out ${
                    animatedWords.includes(index + 3)
                      ? 'blur-0 translate-y-0 opacity-100'
                      : 'translate-y-8 opacity-0 blur-sm'
                  }`}
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  {word}
                </span>
              ))}
            </h1>

            <p
              className={`text-muted-foreground mx-auto max-w-lg text-xl leading-relaxed transition-all duration-700 ease-out text-center ${
                subtitleVisible
                  ? 'blur-0 translate-y-0 opacity-100'
                  : 'translate-y-8 opacity-0 blur-sm'
              }`}
            >
              Komunitas vibe coding Indonesia buat lo yang pengen naik level,
              belajar coding pake AI, kolaborasi project open source, dan
              sharing session tiap minggunya.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:justify-center">
              {!isLoggedIn ? (
                <>
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleJoinWithUs}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Gabung Komunitas Gratis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleViewShowcase}
                  >
                    Lihat Project & Event
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleViewShowcase}
                >
                  Lihat Showcase Kami
                </Button>
              )}
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
              <Suspense
                fallback={
                  <div className="flex items-center justify-center space-x-2">
                    {frameworks.slice(0, 6).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/20 h-12 w-12 animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                }
              >
                <AnimatedTooltip items={frameworks} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden">
            {/* Framework logos moved above Safari mockup */}
          </div>
        </div>
      </div>
    </section>
  )
}
