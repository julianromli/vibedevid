'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/ui/navbar'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { HeartButtonDisplay } from '@/components/ui/heart-button-display'
import { ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fetchProjectsWithSorting, signOut } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import { Footer } from '@/components/ui/footer'
import { UserDisplayName } from '@/components/ui/user-display-name'

export default function ProjectListPage() {
  const router = useRouter()

  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar: string
    username?: string
    role?: number | null
  } | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  // Filter and sort state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isTrendingOpen, setIsTrendingOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedTrending, setSelectedTrending] = useState('Newest')
  const [filterOptions, setFilterOptions] = useState<string[]>(['All'])

  const trendingOptions = ['Trending', 'Top', 'Newest']

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

  // Authentication check
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        console.log('[ProjectList] Checking authentication state...')
        const supabase = createClient()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 3000),
        )

        const sessionPromise = supabase.auth.getSession()

        const result = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as { data: { session: any }; error?: any }

        const {
          data: { session },
        } = result

        if (!isMounted) return

        console.log('[ProjectList] Session data:', session)

        if (session?.user) {
          console.log('[ProjectList] User found in session:', session.user)
          setIsLoggedIn(true)

          // Get user profile from database
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          console.log('[ProjectList] User profile from database:', profile)

          if (profile) {
            const userData = {
              name: profile.display_name,
              email: session.user.email || '',
              avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
              username: profile.username,
              role: profile.role ?? null,
            }
            console.log('[ProjectList] Setting user data:', userData)
            setUser(userData)
          }
        } else {
          console.log('[ProjectList] No session found, user not logged in')
          setIsLoggedIn(false)
          setUser(null)
        }
      } catch (error) {
        if (!isMounted) return
        console.error('[ProjectList] Error in checkAuth:', error)
        setIsLoggedIn(false)
        setUser(null)
      } finally {
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

      console.log('[ProjectList] Auth state change:', event, session)
      if (event === 'SIGNED_IN' && session) {
        console.log('[ProjectList] User signed in via auth state change')
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        console.log('[ProjectList] User signed out, clearing state')
        setIsLoggedIn(false)
        setUser(null)
        setAuthReady(true)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Fetch projects with sorting and filtering
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('[ProjectList] Fetching projects with sorting:', {
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

        // Fetch ALL projects (no limit for list page)
        const { projects: fetchedProjects, error } =
          await fetchProjectsWithSorting(
            sortBy,
            selectedFilter === 'All' ? undefined : selectedFilter,
            100, // High limit to get all projects
          )

        if (error) {
          console.error('[ProjectList] Error fetching projects:', error)
          return
        }

        console.log('[ProjectList] Projects fetched:', fetchedProjects.length)
        setProjects(fetchedProjects || [])
      } catch (error) {
        console.error('[ProjectList] Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch projects when auth state changes OR when sorting/filter changes
    if (authReady) {
      fetchProjects()
    }
  }, [authReady, selectedTrending, selectedFilter])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfile = () => {
    if (user) {
      // Navigate to user profile using their username from database
      router.push(`/${user.username?.toLowerCase().replace(/\s+/g, '')}`)
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
      {/* Navbar dengan background pattern sama seperti profile page */}
      <div className="bg-grid-pattern relative min-h-screen">
        {/* Background Gradient Overlay */}
        <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={user ?? undefined}
          scrollToSection={scrollToSection}
        />

        {/* Main Content */}
        <section className="relative bg-transparent py-12 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
                Showcase Project Developer Indonesia
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                Temukan project keren yang dibuat oleh komunitas vibe coder
                Indonesia. Dari AI tools sampai open source projects, semua
                karya developer terbaik ada di sini.
              </p>
            </div>

            {/* Filter Controls - sama seperti homepage */}
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
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isFiltersOpen ? 'rotate-180' : ''
                      }`}
                    />
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
                              selectedFilter === option
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground'
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
                <Button asChild className="bg-primary hover:bg-primary/90">
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
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isTrendingOpen ? 'rotate-180' : ''
                    }`}
                  />
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
                            selectedTrending === option
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground'
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

            {/* Project Grid - sama layout seperti homepage tapi tampilkan semua */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="group my-4 cursor-pointer py-0">
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
                : projects.map((project) => (
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
                              <UserDisplayName
                                name={project.author.name}
                                role={project.author.role}
                                className="text-muted-foreground text-sm font-medium"
                              />
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

            {/* No projects message */}
            {!loading && projects.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4 text-xl">
                  Belum ada project dengan filter yang dipilih
                </p>
                <Button asChild>
                  <Link href="/project/submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Jadi yang Pertama Submit Project
                  </Link>
                </Button>
              </div>
            )}

            {/* Stats info */}
            {!loading && projects.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-muted-foreground">
                  Menampilkan {projects.length} project dari komunitas developer
                  Indonesia
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer - using reusable Footer component */}
        <Footer />
      </div>
    </div>
  )
}
