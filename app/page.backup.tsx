'use client'

import { ArrowRight, ChevronDown, Code, ExternalLink, Globe, Minus, Plus, Smartphone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Footer } from '@/components/ui/footer'
import { HeartButtonDisplay } from '@/components/ui/heart-button-display'
import { Navbar } from '@/components/ui/navbar'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { ProgressiveImage } from '@/components/ui/progressive-image'
import YouTubeVideoShowcase from '@/components/ui/youtube-video-showcase'
import { fetchProjectsWithSorting, signOut } from '@/lib/actions'
import { getCategories, getCategoryDisplayName } from '@/lib/categories'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Advanced Lazy Loading untuk Mobile Performance Optimization
const TestimonialsColumns = lazy(() =>
  import('@/components/ui/testimonials-columns').then((module) => ({
    default: module.TestimonialsColumns,
  })),
)

import { AnimatedTooltip } from '@/components/ui/animated-tooltip'

// Lazy load Safari component yang heavy untuk LCP improvement
const SafariLazy = lazy(() => Promise.resolve({ default: Safari }))

// Lazy load IntegrationCard dengan delay untuk non-critical sections
const IntegrationCardLazy = lazy(() => Promise.resolve({ default: IntegrationCard }))

// Performance-optimized loading skeleton untuk mobile
const MobileOptimizedSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-muted mb-2 h-4 w-3/4 rounded"></div>
    <div className="bg-muted h-4 w-1/2 rounded"></div>
  </div>
)

const Safari = ({ children, url = 'vibedevid.com' }: { children: React.ReactNode; url?: string }) => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 shadow-2xl">
      {/* Browser Chrome */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-gray-200 px-4 py-3">
        {/* Traffic Lights */}
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        {/* Address Bar */}
        <div className="mx-4 flex-1">
          <div className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600">
            <span className="text-green-600">🔒</span> {url}
          </div>
        </div>
        {/* Browser Controls */}``
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded bg-gray-300"></div>
          <div className="h-6 w-6 rounded bg-gray-300"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white">{children}</div>
    </div>
  )
}
const IntegrationCard = ({
  title,
  description,
  children,
  link = '#',
}: {
  title: string
  description: string
  children: React.ReactNode
  link?: string
}) => {
  return (
    <Card className="p-6">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{description}</p>
        </div>

        <div className="flex gap-3 border-t border-dashed pt-6">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1 pr-2 shadow-none"
          >
            <Link
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
              <ExternalLink className="ml-0 !size-3.5 opacity-50" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    projects: false,
    testimonials: false,
    cta: false,
    faq: false,
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isTrendingOpen, setIsTrendingOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedTrending, setSelectedTrending] = useState('Trending')
  const [visibleProjects, setVisibleProjects] = useState(6)
  const [isPrivacyDrawerOpen, setIsPrivacyDrawerOpen] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar: string
    username?: string // Added username field to user state type
  } | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [animatedWords, setAnimatedWords] = useState<number[]>([])
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [filterOptions, setFilterOptions] = useState<string[]>(['All'])

  // Fetch categories for filter options
  useEffect(() => {
    const fetchFilterCategories = async () => {
      try {
        const categories = await getCategories()
        const categoryDisplayNames = categories.map((cat) => cat.display_name)
        setFilterOptions(['All', ...categoryDisplayNames])
      } catch (error) {
        console.error('Failed to fetch categories for filters:', error)
      }
    }

    fetchFilterCategories()
  }, [])

  useEffect(() => {
    setIsMounted(true)
    // Only update time after component is mounted to avoid hydration mismatch
    const updateTime = () => {
      if (typeof window !== 'undefined') {
        setCurrentTime(new Date().toLocaleTimeString())
      }
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Separate useEffect for authentication
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        console.log('[v0] Checking authentication state...')
        const supabase = createClient()

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 3000),
        )

        const sessionPromise = supabase.auth.getSession()

        const result = (await Promise.race([sessionPromise, timeoutPromise])) as { data: { session: any }; error?: any }
        const {
          data: { session },
        } = result

        if (!isMounted) return

        console.log('[v0] Session data:', session)

        if (session?.user) {
          console.log('[v0] User found in session:', session.user)
          setIsLoggedIn(true)

          // Get user profile from database
          const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single()

          if (!isMounted) return

          console.log('[v0] User profile from database:', profile)

          if (profile) {
            const userData = {
              name: profile.display_name,
              email: session.user.email || '',
              avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
              username: profile.username,
            }
            console.log('[v0] Setting user data:', userData)
            setUser(userData)
          } else {
            if (creatingProfile) {
              console.log('[v0] Profile creation already in progress, skipping...')
              return
            }

            console.log('[v0] No profile found, creating new user profile...')
            setCreatingProfile(true)

            const newProfile = {
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              username:
                session.user.email
                  ?.split('@')[0]
                  ?.toLowerCase()
                  .replace(/[^a-z0-9]/g, '') || `user${Math.floor(Math.random() * 999999)}`,
              avatar_url: session.user.user_metadata?.avatar_url || '/vibedev-guest-avatar.png',
              bio: '',
              location: '',
              website: '',
              github_url: '',
              twitter_url: '',
              joined_at: new Date().toISOString(),
            }

            console.log('[v0] Attempting to insert new profile:', newProfile)

            try {
              const { data: createdProfile, error: insertError } = await supabase
                .from('users')
                .upsert(newProfile, { onConflict: 'id' })
                .select()
                .single()

              if (!isMounted) return

              if (insertError) {
                console.error('[v0] Error creating user profile:', insertError)
                console.error('[v0] Insert error details:', {
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code,
                })
                setCreatingProfile(false)
                return
              }

              console.log('[v0] Successfully created user profile:', createdProfile)

              const userData = {
                name: newProfile.display_name,
                email: session.user.email || '',
                avatar: newProfile.avatar_url,
                username: newProfile.username,
              }
              console.log('[v0] Created and set new user data:', userData)
              setUser(userData)
              setCreatingProfile(false)
            } catch (error) {
              if (!isMounted) return
              console.error('[v0] Unexpected error creating profile:', error)
              setCreatingProfile(false)
            }
          }
        } else {
          console.log('[v0] No session found, user not logged in')
          setIsLoggedIn(false)
          setUser(null)
          setCreatingProfile(false)
        }
      } catch (error) {
        if (!isMounted) return
        console.error('[v0] Error in checkAuth:', error)
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
      } finally {
        // Mark auth as ready regardless of success/failure
        setAuthReady(true)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('[v0] Auth state change:', event, session)
      if (event === 'SIGNED_IN' && session) {
        console.log('[v0] User signed in via auth state change')
        // Don't re-run checkAuth here, it causes double execution
        // Just update the auth ready state
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        console.log('[v0] User signed out, clearing state')
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
        setAuthReady(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch projects with sorting - now depends on auth state AND sorting/filter changes
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('[v0] Fetching projects with sorting:', {
          selectedTrending,
          selectedFilter,
          authReady,
        })

        setLoading(true)

        // Convert selectedTrending to sortBy parameter
        let sortBy: 'trending' | 'top' | 'newest' = 'newest'
        switch (selectedTrending) {
          case 'Trending':
            sortBy = 'trending'
            break
          case 'Top':
            sortBy = 'top'
            break
          case 'Newest':
          default:
            sortBy = 'newest'
            break
        }

        // Fetch projects with new sorting function
        const { projects: fetchedProjects, error } = await fetchProjectsWithSorting(
          sortBy,
          selectedFilter === 'All' ? undefined : selectedFilter,
          20, // limit
        )

        if (error) {
          console.error('[v0] Error fetching projects:', error)
          return
        }

        console.log('[v0] Projects fetched with sorting:', fetchedProjects.length)
        setProjects(fetchedProjects || [])
      } catch (error) {
        console.error('[v0] Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch projects when auth state changes OR when sorting/filter changes
    if (authReady) {
      fetchProjects()
    }
  }, [authReady, selectedTrending, selectedFilter]) // Add sorting and filter dependencies

  // Remove redundant likes fetching - already handled in fetchProjects

  const testimonials = [
    {
      text: 'VibeDev ID ngubah cara gue belajar coding! Dari yang tadinya stuck sendirian, sekarang punya temen-temen yang solid buat diskusi dan kolaborasi project. Networking di sini top banget!',
      image: 'https://github.com/shadcn.png',
      name: 'Rizki Pratama',
      role: 'Frontend Developer, Tokopedia',
    },
    {
      text: 'Komunitas yang benar-benar supportive! Gue berhasil launch startup fintech pertama gue berkat feedback dan mentorship dari senior developer di VibeDev ID. Game changer banget!',
      image: '/professional-woman-dark-hair.png',
      name: 'Sari Indrawati',
      role: 'Founder, PayKita',
    },
    {
      text: 'Sebagai fresh graduate, VibeDev ID kasih gue exposure ke real-world projects dan code review yang berkualitas. Sekarang gue udah confident kerja di tech company besar.',
      image: '/blonde-woman-glasses.png',
      name: 'Amanda Putri',
      role: 'Backend Developer, Gojek',
    },
    {
      text: 'Project showcase di VibeDev ID jadi portfolio terbaik gue. Banyak recruiter yang approach gue setelah liat karya-karya yang gue share di platform ini.',
      image: '/asian-man-short-hair.png',
      name: 'Budi Santoso',
      role: 'Full Stack Developer, Bukalapak',
    },
    {
      text: 'Dari hobby project jadi bisnis yang profitable! Kolaborasi sama member VibeDev ID bikin gue nemuin co-founder yang tepat dan sekarang startup kami udah dapetin seed funding.',
      image: 'https://github.com/shadcn.png',
      name: 'Dimas Ardiansyah',
      role: 'CTO, EduTech Solutions',
    },
    {
      text: 'Workshop dan tech talk di VibeDev ID selalu update dengan teknologi terbaru. Gue bisa ngikutin trend React, Next.js, sampai AI development berkat komunitas ini.',
      image: 'https://github.com/shadcn.png',
      name: 'Maya Sari',
      role: 'Senior React Developer, Traveloka',
    },
  ]

  const trendingOptions = ['Trending', 'Top', 'Newest']

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfile = () => {
    if (user) {
      // Navigate to user profile using their username from database
      router.push(`/${user.username?.toLowerCase().replace(/\s+/g, '')}`)
    }
  }

  const frameworks = [
    {
      id: 1,
      name: 'React',
      designation: '18.3',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    },
    {
      id: 2,
      name: 'Next.js',
      designation: '15.3',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    },
    {
      id: 3,
      name: 'Vue.js',
      designation: '3.4',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    },
    {
      id: 4,
      name: 'Angular',
      designation: '18.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    },
    {
      id: 5,
      name: 'Svelte',
      designation: '5.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
    },
    {
      id: 6,
      name: 'Tailwind CSS',
      designation: '4.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
    },
    {
      id: 7,
      name: 'TypeScript',
      designation: '5.6',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    },
    {
      id: 8,
      name: 'Node.js',
      designation: '22.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    },
    {
      id: 9,
      name: 'Express.js',
      designation: '4.19',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
    },
    {
      id: 10,
      name: 'MongoDB',
      designation: '7.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    },
    {
      id: 11,
      name: 'PostgreSQL',
      designation: '16.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    },
    {
      id: 12,
      name: 'Docker',
      designation: '25.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    },
    {
      id: 13,
      name: 'AWS',
      designation: 'Cloud',
      image: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    },
    {
      id: 14,
      name: 'Firebase',
      designation: '10.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
    },
    {
      id: 15,
      name: 'Vite',
      designation: '5.0',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg',
    },
    {
      id: 16,
      name: 'Figma',
      designation: 'Design',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
    },
    {
      id: 17,
      name: 'Vercel',
      designation: 'Deploy',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg',
    },
    {
      id: 18,
      name: 'Git',
      designation: '2.45',
      image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 },
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const faqs = [
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const handleSignIn = () => {
    router.push('/user/auth')
  }

  const handleJoinWithUs = () => {
    window.open('https://s.id/vibedev', '_blank')
  }

  const handleViewShowcase = () => {
    scrollToSection('projects')
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

      {/* Pass real auth state to Navbar */}
      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
        scrollToSection={scrollToSection}
      />

      {/* Hero Section */}
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
                  <span className="ml-2 font-semibold text-orange-500">Hadiah 5 JUTA RUPIAH</span>
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
                className={`text-muted-foreground mx-auto max-w-lg text-center text-xl leading-relaxed transition-all duration-700 ease-out ${
                  subtitleVisible ? 'blur-0 translate-y-0 opacity-100' : 'translate-y-8 opacity-0 blur-sm'
                }`}
              >
                Komunitas vibe coding Indonesia buat lo yang pengen naik level, belajar coding pake AI, kolaborasi
                project open source, dan sharing session tiap minggunya.
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
              <Safari url="vibedevid.com">
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
              </Safari>
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
            <div className="relative overflow-hidden">{/* Framework logos moved above Safari mockup */}</div>
          </div>
        </div>
      </section>

      {/* Project Showcase Section */}
      <section
        className="bg-muted/20 py-12"
        id="projects"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              Showcase Project Developer Indonesia
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Temukan project keren yang dibuat oleh komunitas vibe coder Indonesia. Dari AI tools sampai open source
              projects, semua karya developer terbaik ada di sini.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Filters Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2"
                >
                  Filter
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isFiltersOpen && (
                  <div className="bg-background border-border absolute top-full left-0 z-10 mt-2 w-48 rounded-lg border shadow-lg">
                    <div className="p-2">
                      {filterOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedFilter(option)
                            setIsFiltersOpen(false)
                          }}
                          className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            selectedFilter === option ? 'bg-muted text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <Button
                asChild
                className="bg-primary hover:bg-primary/90"
              >
                <Link href="/project/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Project
                </Link>
              </Button>
            </div>

            {/* Trending Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsTrendingOpen(!isTrendingOpen)}
                className="flex items-center gap-2"
              >
                {selectedTrending}
                <ChevronDown className={`h-4 w-4 transition-transform ${isTrendingOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isTrendingOpen && (
                <div className="bg-background border-border absolute top-full right-0 z-10 mt-2 w-32 rounded-lg border shadow-lg">
                  <div className="p-2">
                    {trendingOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedTrending(option)
                          setIsTrendingOpen(false)
                        }}
                        className={`hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedTrending === option ? 'bg-muted text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="group my-4 cursor-pointer py-0"
                  >
                    <div className="bg-muted relative mb-4 animate-pulse overflow-hidden rounded-lg">
                      <div className="bg-muted h-64 w-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-muted h-6 animate-pulse rounded"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-muted h-8 w-8 animate-pulse rounded-full"></div>
                          <div className="bg-muted h-4 w-24 animate-pulse rounded"></div>
                        </div>
                        <div className="bg-muted h-8 w-16 animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              : projects.slice(0, visibleProjects).map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.slug}`}
                    className="group my-4 block cursor-pointer py-0"
                  >
                    {/* Thumbnail Preview Section */}
                    <div className="bg-background relative mb-4 overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl">
                      <AspectRatio ratio={16 / 9}>
                        <Image
                          src={project.image || '/vibedev-guest-avatar.png'}
                          alt={project.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = '/vibedev-guest-avatar.png'
                          }}
                        />
                      </AspectRatio>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                          {project.category}
                        </span>
                      </div>
                    </div>

                    {/* Project Details Section */}
                    <div className="space-y-3">
                      <h3 className="text-foreground group-hover:text-primary line-clamp-2 py-0 text-lg leading-tight font-semibold transition-colors duration-300">
                        {project.title}
                      </h3>

                      {/* Author and Stats */}
                      <div className="flex items-center justify-between py-0">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="relative z-10 flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/${project.author.username}`)
                            }}
                          >
                            <OptimizedAvatar
                              src={project.author.avatar}
                              alt={project.author.name}
                              size="sm"
                              className="ring-muted ring-2"
                              showSkeleton={false}
                            />
                            <span className="text-muted-foreground text-sm font-medium">{project.author.name}</span>
                          </div>
                        </div>
                        <div className="relative z-20">
                          <HeartButtonDisplay
                            likes={project.likes || 0}
                            variant="default"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>

          {/* Load More button */}
          {!loading && visibleProjects < projects.length && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => setVisibleProjects((prev) => prev + 6)}
                className="px-8 py-2"
              >
                Muat Project Lainnya
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* YouTube Video Vibe Coding Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          <YouTubeVideoShowcase />
        </div>
      </section>

      {/* AI Coding Tools Integration Section */}
      <section
        id="integrations"
        className="py-20"
        data-animate
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
              AI untuk Coding & Development Tools
            </h2>
            <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-xl">
              Explore tools AI terbaru untuk coding pake AI yang lebih efisien. Integrasikan AI coding agents favorit
              untuk workflow development yang next-level.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IntegrationCard
              title="Lovable"
              description="AI co-engineer yang build full-stack apps dari single prompt. Integrates dengan auth, payments, dan databases otomatis."
              link="https://lovable.dev/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lovable.svg"
                  alt="Lovable"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="v0.app"
              description="AI-powered design-to-code platform yang convert ideas jadi functional apps. Rapid prototyping dengan visual interface builder."
              link="https://v0.app/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/v0.svg"
                  alt="v0"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="OpenAI Codex"
              description="AI programming assistant yang bisa generate, explain, dan debug code. Supports multiple languages dengan natural language interface."
              link="https://github.com/openai/codex"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg"
                  alt="OpenAI Codex"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="Cursor"
              description="AI-powered code editor yang understand codebase lo. Natural language to code dengan intelligent completion dan real-time suggestions."
              link="https://cursor.com/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/cursor.svg"
                  alt="Cursor"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="Warp"
              description="Modern terminal dengan Active AI features, command suggestions, dan intelligent autocompletion untuk workflow yang lebih efficient."
              link="https://warp.dev/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="/warpdev.jpg"
                  alt="Warp"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>

            <IntegrationCard
              title="Trae"
              description="AI-powered development framework yang accelerate project creation dengan intelligent code generation dan automation tools."
              link="https://trae.ai/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/trae.svg"
                  alt="Trae"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section
        id="reviews"
        className="bg-muted/20 py-20"
        data-animate
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">Review Member Komunitas Vibe Coding</h2>
            <p className="text-muted-foreground text-xl">
              Testimoni asli dari developer Indonesia yang udah join komunitas kami
            </p>
          </div>

          <div className="flex max-h-[600px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
            <Suspense
              fallback={
                <div className="flex justify-center gap-6">
                  <div className="flex flex-col space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/20 w-80 animate-pulse rounded-lg p-4"
                      >
                        <div className="bg-muted/30 mb-3 h-20 rounded"></div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-muted/30 h-10 w-10 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="bg-muted/30 h-4 w-3/4 rounded"></div>
                            <div className="bg-muted/20 h-3 w-1/2 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <TestimonialsColumns
                testimonials={testimonials.slice(0, 3)}
                duration={15}
              />
              <TestimonialsColumns
                testimonials={testimonials.slice(3, 6)}
                className="hidden md:block"
                duration={19}
              />
              <TestimonialsColumns
                testimonials={testimonials.slice(6, 9)}
                className="hidden lg:block"
                duration={17}
              />
            </Suspense>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-20"
        data-animate
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">FAQ Komunitas Vibe Coding Indonesia</h2>
            <p className="text-muted-foreground text-xl">
              Semua yang perlu lo tau tentang gabung di komunitas vibe coder Indonesia terbesar
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-700 hover:shadow-md ${
                  isVisible.faq ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => toggleFAQ(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left font-semibold">{faq.question}</h3>
                    <div className="ml-4 flex-shrink-0 transition-transform duration-300">
                      {openFAQ === index ? (
                        <Minus className="text-muted-foreground h-5 w-5" />
                      ) : (
                        <Plus className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFAQ === index ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-muted-foreground text-left leading-relaxed">{faq.answer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <Footer />
    </div>
  )
}
