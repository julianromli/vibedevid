'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { AIToolsSection } from '@/components/sections/ai-tools-section'
import { CommunityFeaturesSection } from '@/components/sections/community-features-section'
import { CTASection } from '@/components/sections/cta-section'
import { FAQSection } from '@/components/sections/faq-section'
import { HeroSection } from '@/components/sections/hero-section'
import { ProjectShowcase } from '@/components/sections/project-showcase'
import { ReviewsSection } from '@/components/sections/reviews-section'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import YouTubeVideoShowcase from '@/components/ui/youtube-video-showcase'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import { FAQ_DATA } from '@/lib/constants/faqs'
import type { User } from '@/types/homepage'

interface HomePageClientProps {
  initialIsLoggedIn: boolean
  initialUser: User | null
}

export default function HomePageClient({ initialIsLoggedIn, initialUser }: HomePageClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn)
  const [user, setUser] = useState<User | null>(initialUser)

  const projectFilters = useProjectFilters(true)
  const isVisible = useIntersectionObserver()

  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  useEffect(() => {
    setIsMounted(true)
    const updateTime = () => {
      if (typeof window !== 'undefined') {
        setCurrentTime(new Date().toLocaleTimeString())
      }
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const handleJoinWithUs = () => {
    window.open('https://dub.sh/vibedevid-form', '_blank')
  }

  const handleViewShowcase = () => {
    const element = document.getElementById('projects')
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VibeDev ID',
            alternateName: ['Komunitas Vibe Coding Indonesia', 'VibeDev Indonesia'],
            url: 'https://vibedevid.com',
            logo: 'https://vibedevid.com/vibedev-logo.png',
            description:
              'Komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators. Tempat belajar coding pake AI, kolaborasi project open source, dan networking dengan vibe coder Indonesia terbaik.',
            foundingDate: '2024',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'ID',
              addressRegion: 'Indonesia',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Community Support',
              email: 'hello@vibedevid.com',
            },
            sameAs: [
              'https://github.com/vibedevid',
              'https://twitter.com/vibedevid',
              'https://linkedin.com/company/vibedevid',
            ],
            memberOf: {
              '@type': 'Organization',
              name: 'Indonesian Developer Community',
            },
            keywords: [
              'vibe coding',
              'komunitas vibe coding',
              'komunitas vibe coding indonesia',
              'vibe coder indonesia',
              'coding pake AI',
              'AI untuk coding',
              'developer indonesia',
              'open source indonesia',
            ],
            audience: {
              '@type': 'Audience',
              audienceType: 'Developers, AI Enthusiasts, Tech Innovators',
              geographicArea: 'Indonesia',
            },
          }),
        }}
      />

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

      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
        scrollToSection={scrollToSection}
      />

      <HeroSection
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
        handleJoinWithUs={handleJoinWithUs}
        handleViewShowcase={handleViewShowcase}
      />

      <ErrorBoundary sectionName="Project Showcase">
        <ProjectShowcase
          projects={projectFilters.projects}
          loading={projectFilters.loading}
          selectedFilter={projectFilters.selectedFilter}
          setSelectedFilter={projectFilters.setSelectedFilter}
          selectedTrending={projectFilters.selectedTrending}
          setSelectedTrending={projectFilters.setSelectedTrending}
          filterOptions={projectFilters.filterOptions}
        />
      </ErrorBoundary>

      <ErrorBoundary sectionName="Video Showcase">
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
            <YouTubeVideoShowcase />
          </div>
        </section>
      </ErrorBoundary>

      <CommunityFeaturesSection />

      <AIToolsSection />

      <ReviewsSection />

      <FAQSection
        openFAQ={openFAQ}
        toggleFAQ={toggleFAQ}
        isVisible={isVisible.faq}
      />

      <CTASection
        currentTime={currentTime}
        isMounted={isMounted}
        handleJoinWithUs={handleJoinWithUs}
      />

      <Footer />
    </div>
  )
}
