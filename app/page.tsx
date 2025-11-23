/**
 * Homepage - Refactored with modular components
 * Reduced from 1511 lines to ~200 lines using extracted sections
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'
import YouTubeVideoShowcase from '@/components/ui/youtube-video-showcase'
import { HeroSection } from '@/components/sections/hero-section'
import { ProjectShowcase } from '@/components/sections/project-showcase'
import { CommunityFeaturesSection } from '@/components/sections/community-features-section'
import { AIToolsSection } from '@/components/sections/ai-tools-section'
import { ReviewsSection } from '@/components/sections/reviews-section'
import { FAQSection } from '@/components/sections/faq-section'
import { CTASection } from '@/components/sections/cta-section'
import { useAuth } from '@/hooks/useAuth'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { signOut } from '@/lib/actions'
import type { FAQ } from '@/types/homepage'

// FAQ data for JSON-LD schema
const faqs: FAQ[] = [
  {
    question: 'Apa itu VibeDev ID?',
    answer:
      'VibeDev ID adalah komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators yang punya visi sama untuk bikin produk digital keren. Kami menghubungkan vibe coder Indonesia yang sepikiran untuk kolaborasi, belajar coding pake AI, dan berkembang bareng.',
  },
  {
    question: 'Gimana cara gabung komunitas vibe coding ini?',
    answer:
      "Gabung komunitas vibe coding Indonesia gampang banget! Klik tombol 'Gabung Komunitas Gratis' dan lengkapi profil lo. Kami welcome developer dari semua level - dari pemula yang baru belajar coding pake AI sampai professional berpengalaman.",
  },
  {
    question: 'Ada biaya untuk join komunitas vibe coding Indonesia?',
    answer:
      'Membership basic di komunitas vibe coding kami 100% gratis! Lo dapet akses ke community forums, project showcases, networking opportunities, dan belajar coding pake AI bareng member lain. Semua fitur inti gratis untuk semua vibe coder Indonesia.',
  },
  {
    question: 'Bisa kolaborasi project dengan member lain?',
    answer:
      'Kolaborasi itu inti dari komunitas vibe coding kami! Lo bisa cari teammates untuk coding pake AI, join project open source yang udah ada, atau mulai project lo sendiri. Banyak vibe coder Indonesia di sini yang udah sukses bikin startup bareng.',
  },
  {
    question: 'Teknologi dan AI tools apa aja yang didukung?',
    answer:
      'Komunitas vibe coding Indonesia kami embrace semua teknologi modern! Member aktif kerja dengan React, Next.js, Python, AI/ML frameworks, dan tools untuk coding pake AI seperti GitHub Copilot, ChatGPT, dan Claude. Kalau itu cutting-edge tech, lo pasti nemu expert vibe coder di sini.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Custom hooks for state management
  const auth = useAuth()
  const projectFilters = useProjectFilters(auth.authReady)
  const isVisible = useIntersectionObserver()
  
  // FAQ state (used by FAQSection)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  // Mount check for hydration
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

  // Event handlers
  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfile = () => {
    if (auth.user) {
      router.push(`/${auth.user.username?.toLowerCase().replace(/\s+/g, '')}`)
    }
  }

  const handleSignIn = () => {
    router.push('/user/auth')
  }

  const handleJoinWithUs = () => {
    window.open('https://s.id/vibedev', '_blank')
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
      {/* JSON-LD Schema Markup for SEO */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VibeDev ID',
            alternateName: [
              'Komunitas Vibe Coding Indonesia',
              'VibeDev Indonesia',
            ],
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
            mainEntity: faqs.map((faq) => ({
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

      {/* Navigation */}
      <Navbar
        showNavigation={true}
        isLoggedIn={auth.isLoggedIn}
        user={auth.user ?? undefined}
        scrollToSection={scrollToSection}
      />

      {/* Hero Section */}
      <HeroSection
        isLoggedIn={auth.isLoggedIn}
        user={auth.user ?? undefined}
        handleJoinWithUs={handleJoinWithUs}
        handleViewShowcase={handleViewShowcase}
      />

      {/* Project Showcase Section */}
      <ProjectShowcase
        projects={projectFilters.projects}
        loading={projectFilters.loading}
        selectedFilter={projectFilters.selectedFilter}
        setSelectedFilter={projectFilters.setSelectedFilter}
        selectedTrending={projectFilters.selectedTrending}
        setSelectedTrending={projectFilters.setSelectedTrending}
        filterOptions={projectFilters.filterOptions}
      />

      {/* YouTube Video Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          <YouTubeVideoShowcase />
        </div>
      </section>

      {/* Community Features Section */}
      <CommunityFeaturesSection />

      {/* AI Tools Integration Section */}
      <AIToolsSection />

      {/* Reviews Section */}
      <ReviewsSection />

      {/* FAQ Section */}
      <FAQSection 
        openFAQ={openFAQ}
        toggleFAQ={toggleFAQ}
        isVisible={isVisible.faq}
      />

      {/* CTA Section */}
      <CTASection
        currentTime={currentTime}
        isMounted={isMounted}
        handleJoinWithUs={handleJoinWithUs}
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}
