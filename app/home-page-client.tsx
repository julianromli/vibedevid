'use client'

import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
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
import { YouTubeVideoShowcase } from '@/components/ui/youtube-video-showcase'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import type { FAQ, Project, User, VibeVideo } from '@/types/homepage'

interface HomePageClientProps {
  initialIsLoggedIn: boolean
  initialUser: User | null
  initialProjects: Project[]
  initialFilterOptions: string[]
  initialVibeVideos: VibeVideo[]
}

export default function HomePageClient({
  initialIsLoggedIn,
  initialUser,
  initialProjects,
  initialFilterOptions,
  initialVibeVideos,
}: HomePageClientProps) {
  const commonT = useTranslations('common')
  const metadataT = useTranslations('metadata')
  const faqT = useTranslations('faq')
  const faqItems = Object.values(faqT.raw('items') as Record<string, FAQ>)
  const organizationKeywords = metadataT.raw('organization.keywords') as string[]
  const projectFilters = useProjectFilters({
    authReady: true,
    initialProjects,
    initialFilterOptions,
  })
  const isVisible = useIntersectionObserver()

  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

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

  return (
    <div className="bg-background min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:rounded-br-md focus:shadow-md focus:font-medium"
      >
        {commonT('skipToMainContent')}
      </a>

      <Script
        id="organization-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema must be injected as raw script content.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VibeDev ID',
            alternateName: ['Komunitas Vibe Coding Indonesia', 'VibeDev Indonesia'],
            url: 'https://vibedevid.com',
            logo: 'https://vibedevid.com/vibedev-logo.png',
            description: metadataT('description'),
            foundingDate: '2024',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'ID',
              addressRegion: 'Indonesia',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: metadataT('organization.contactType'),
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
            keywords: [...organizationKeywords],
            audience: {
              '@type': 'Audience',
              audienceType: metadataT('organization.audienceType'),
              geographicArea: 'Indonesia',
            },
          }),
        }}
      />

      <Script
        id="faq-schema"
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema must be injected as raw script content.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((faq) => ({
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
        isLoggedIn={initialIsLoggedIn}
        user={initialUser ?? undefined}
      />

      <main id="main-content">
        <HeroSection
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
              <YouTubeVideoShowcase vibeVideos={initialVibeVideos} />
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

        <CTASection handleJoinWithUs={handleJoinWithUs} />
      </main>

      <Footer />
    </div>
  )
}
