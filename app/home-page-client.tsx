'use client'

import { AIToolsSection } from '@/components/sections/ai-tools-section'
import { CommunityFeaturesSection } from '@/components/sections/community-features-section'
import { CTASection } from '@/components/sections/cta-section'
import { FAQSection } from '@/components/sections/faq-section'
import { HeroSection } from '@/components/sections/hero-section'
import { HomeStructuredData } from '@/components/sections/home-structured-data'
import { ProjectShowcase } from '@/components/sections/project-showcase'
import { ProjectShowcaseProvider } from '@/components/sections/project-showcase/project-showcase-context'
import { ReviewsSection } from '@/components/sections/reviews-section'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { YouTubeVideoShowcase } from '@/components/ui/youtube-video-showcase'
import type { Project, ProjectFilterOption, SortBy, User, VibeVideo } from '@/types/homepage'

const JOIN_HREF = 'https://dub.sh/vibedevid-form'

interface HomePageClientProps {
  initialIsLoggedIn: boolean
  initialUser: User | null
  initialProjects: Project[]
  initialCategories: ProjectFilterOption[]
  initialFilter: string
  initialSort: SortBy
  initialVibeVideos: VibeVideo[]
}

function scrollToShowcase() {
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function HomePageClient({
  initialIsLoggedIn,
  initialUser,
  initialProjects,
  initialCategories,
  initialFilter,
  initialSort,
  initialVibeVideos,
}: HomePageClientProps) {
  return (
    <main
      id="main-content"
      className="bg-background min-h-screen"
    >
      <HomeStructuredData />

      <Navbar
        showNavigation={true}
        isLoggedIn={initialIsLoggedIn}
        user={initialUser ?? undefined}
      />

      <HeroSection
        joinHref={JOIN_HREF}
        handleViewShowcase={scrollToShowcase}
      />

      <ErrorBoundary sectionName="Project Showcase">
        <ProjectShowcaseProvider
          initialProjects={initialProjects}
          initialCategories={initialCategories}
          initialFilter={initialFilter}
          initialSort={initialSort}
        >
          <ProjectShowcase />
        </ProjectShowcaseProvider>
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

      <FAQSection />

      <CTASection joinHref={JOIN_HREF} />

      <Footer />
    </main>
  )
}
