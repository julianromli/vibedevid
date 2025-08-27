"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TestimonialsColumns } from "@/components/ui/testimonials-columns"
import { HeartButton } from "@/components/ui/heart-button"
import { Navbar } from "@/components/ui/navbar"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ChevronDown, Code, Smartphone, Globe, ArrowRight, Plus, Minus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/actions"
import AnimatedTooltip from "@/components/ui/animated-tooltip"
import { getBatchLikeStatus } from "@/lib/actions"

const Safari = ({ children, url = "vibedev.id" }) => {
  return (
    <div className="relative w-full bg-gray-100 rounded-xl shadow-2xl overflow-hidden">
      {/* Browser Chrome */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-200 border-b border-gray-300">
        {/* Traffic Lights */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>

        {/* Address Bar */}
        <div className="flex-1 mx-4">
          <div className="bg-white rounded-md px-3 py-1 text-sm text-gray-600 border border-gray-300">
            <span className="text-green-600">🔒</span> {url}
          </div>
        </div>

        {/* Browser Controls */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white">{children}</div>
    </div>
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
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [selectedTrending, setSelectedTrending] = useState("Trending")
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
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [animatedWords, setAnimatedWords] = useState<number[]>([])
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [likesData, setLikesData] = useState<Record<string, { totalLikes: number; isLiked: boolean }>>({})

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
        console.log("[v0] Checking authentication state...")
        const supabase = createClient()

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        console.log("[v0] Session data:", session)

        if (session?.user) {
          console.log("[v0] User found in session:", session.user)
          setIsLoggedIn(true)

          // Get user profile from database
          const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (!isMounted) return

          console.log("[v0] User profile from database:", profile)

          if (profile) {
            const userData = {
              name: profile.display_name,
              email: session.user.email || "",
              avatar: profile.avatar_url || "/vibedev-guest-avatar.png",
              username: profile.username,
            }
            console.log("[v0] Setting user data:", userData)
            setUser(userData)
          } else {
            if (creatingProfile) {
              console.log("[v0] Profile creation already in progress, skipping...")
              return
            }

            console.log("[v0] No profile found, creating new user profile...")
            setCreatingProfile(true)

            const newProfile = {
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
              username:
                session.user.email
                  ?.split("@")[0]
                  ?.toLowerCase()
                  .replace(/[^a-z0-9]/g, "") || `user${Math.floor(Math.random() * 999999)}`,
              avatar_url: session.user.user_metadata?.avatar_url || "/vibedev-guest-avatar.png",
              bio: "",
              location: "",
              website: "",
              github_url: "",
              twitter_url: "",
              joined_at: new Date().toISOString(),
            }

            console.log("[v0] Attempting to insert new profile:", newProfile)

            try {
              const { data: createdProfile, error: insertError } = await supabase
                .from("users")
                .upsert(newProfile, { onConflict: "id" })
                .select()
                .single()

              if (!isMounted) return

              if (insertError) {
                console.error("[v0] Error creating user profile:", insertError)
                console.error("[v0] Insert error details:", {
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code,
                })
                setCreatingProfile(false)
                return
              }

              console.log("[v0] Successfully created user profile:", createdProfile)

              const userData = {
                name: newProfile.display_name,
                email: session.user.email || "",
                avatar: newProfile.avatar_url,
                username: newProfile.username,
              }
              console.log("[v0] Created and set new user data:", userData)
              setUser(userData)
              setCreatingProfile(false)
            } catch (error) {
              if (!isMounted) return
              console.error("[v0] Unexpected error creating profile:", error)
              setCreatingProfile(false)
            }
          }
        } else {
          console.log("[v0] No session found, user not logged in")
          setIsLoggedIn(false)
          setUser(null)
          setCreatingProfile(false)
        }
      } catch (error) {
        if (!isMounted) return
        console.error("[v0] Error in checkAuth:", error)
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      console.log("[v0] Auth state change:", event, session)
      if (event === "SIGNED_IN" && session) {
        console.log("[v0] User signed in, updating state")
        setIsLoggedIn(true)
        // Avoid calling checkAuth again to prevent race conditions
      } else if (event === "SIGNED_OUT") {
        console.log("[v0] User signed out, clearing state")
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Separate useEffect for fetching projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const supabase = createClient()

        // Single JOIN query untuk better performance
        const { data: projectsWithUsers, error } = await supabase
          .from("projects")
          .select(`
            *,
            users!author_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .order("created_at", { ascending: false })
          .limit(20) // Limit initial load

        if (error) {
          console.error("Error fetching projects:", error)
          return
        }

        const formattedProjects = projectsWithUsers.map((project) => ({
          id: project.id.toString(),
          title: project.title,
          description: project.description,
          image: project.image_url,
          author: {
            name: project.users?.display_name || 'Unknown',
            username: project.users?.username || 'unknown',
            avatar: project.users?.avatar_url || "/vibedev-guest-avatar.png",
          },
          url: project.website_url,
          category: project.category,
          likes: 0, // Will be updated by batch likes
          views: 0,
          createdAt: project.created_at,
        }))

        setProjects(formattedProjects)

        if (formattedProjects.length > 0) {
          const projectIds = formattedProjects.map((p) => p.id)
          const { likesData: batchLikesData, error: likesError } = await getBatchLikeStatus(projectIds)

          if (!likesError && batchLikesData) {
            setLikesData(batchLikesData)
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Remove redundant likes fetching - already handled in fetchProjects

  const testimonials = [
    {
      text: "VibeDev ID ngubah cara gue belajar coding! Dari yang tadinya stuck sendirian, sekarang punya temen-temen yang solid buat diskusi dan kolaborasi project. Networking di sini top banget!",
      image: "https://github.com/shadcn.png",
      name: "Rizki Pratama",
      role: "Frontend Developer, Tokopedia",
    },
    {
      text: "Komunitas yang benar-benar supportive! Gue berhasil launch startup fintech pertama gue berkat feedback dan mentorship dari senior developer di VibeDev ID. Game changer banget!",
      image: "/professional-woman-dark-hair.png",
      name: "Sari Indrawati",
      role: "Founder, PayKita",
    },
    {
      text: "Sebagai fresh graduate, VibeDev ID kasih gue exposure ke real-world projects dan code review yang berkualitas. Sekarang gue udah confident kerja di tech company besar.",
      image: "/blonde-woman-glasses.png",
      name: "Amanda Putri",
      role: "Backend Developer, Gojek",
    },
    {
      text: "Project showcase di VibeDev ID jadi portfolio terbaik gue. Banyak recruiter yang approach gue setelah liat karya-karya yang gue share di platform ini.",
      image: "/asian-man-short-hair.png",
      name: "Budi Santoso",
      role: "Full Stack Developer, Bukalapak",
    },
    {
      text: "Dari hobby project jadi bisnis yang profitable! Kolaborasi sama member VibeDev ID bikin gue nemuin co-founder yang tepat dan sekarang startup kami udah dapetin seed funding.",
      image: "https://github.com/shadcn.png",
      name: "Dimas Ardiansyah",
      role: "CTO, EduTech Solutions",
    },
    {
      text: "Workshop dan tech talk di VibeDev ID selalu update dengan teknologi terbaru. Gue bisa ngikutin trend React, Next.js, sampai AI development berkat komunitas ini.",
      image: "https://github.com/shadcn.png",
      name: "Maya Sari",
      role: "Senior React Developer, Traveloka",
    },
  ]

  const filterOptions = ["All", "Personal Web", "SaaS", "Landing Page"]
  const trendingOptions = ["Trending", "Top", "Newest"]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfile = () => {
    if (user) {
      // Navigate to user profile using their username from database
      router.push(`/${user.username.toLowerCase().replace(/\s+/g, "")}`)
    }
  }

  const frameworks = [
    {
      id: 1,
      name: "React",
      designation: "18.3",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    },
    {
      id: 2,
      name: "Next.js",
      designation: "15.3",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    },
    {
      id: 3,
      name: "Vue.js",
      designation: "3.4",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
    },
    {
      id: 4,
      name: "Angular",
      designation: "18.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg",
    },
    {
      id: 5,
      name: "Svelte",
      designation: "5.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg",
    },
    {
      id: 6,
      name: "Tailwind CSS",
      designation: "4.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
    },
    {
      id: 7,
      name: "TypeScript",
      designation: "5.6",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    },
    {
      id: 8,
      name: "Node.js",
      designation: "22.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    },
    {
      id: 9,
      name: "Express.js",
      designation: "4.19",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg",
    },
    {
      id: 10,
      name: "MongoDB",
      designation: "7.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg",
    },
    {
      id: 11,
      name: "PostgreSQL",
      designation: "16.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    },
    {
      id: 12,
      name: "Docker",
      designation: "25.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
    },
    {
      id: 13,
      name: "AWS",
      designation: "Cloud",
      image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    },
    {
      id: 14,
      name: "Firebase",
      designation: "10.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
    },
    {
      id: 15,
      name: "Vite",
      designation: "5.0",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg",
    },
    {
      id: 16,
      name: "Figma",
      designation: "Design",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
    },
    {
      id: 17,
      name: "Vercel",
      designation: "Deploy",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg",
    },
    {
      id: 18,
      name: "Git",
      designation: "2.45",
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
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

    const sections = document.querySelectorAll("[data-animate]")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const titlePart1 = ["When", "the", "Codes"]
    const titlePart2 = ["Meet", "the", "Vibes"]
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

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const faqs = [
    {
      question: "Apa itu VibeDev ID?",
      answer:
        "VibeDev ID adalah komunitas vibrant developer, AI enthusiasts, dan tech innovators yang punya visi dan passion yang sama untuk bikin produk digital yang keren. Kami menghubungkan creator yang sepikiran untuk kolaborasi, belajar, dan berkembang bareng.",
    },
    {
      question: "Gimana cara gabung komunitas?",
      answer:
        "Gabung gampang banget! Klik tombol 'Gabung Bersama Kami' dan lengkapi profil lo. Kami welcome developer dari semua level - dari pemula sampai professional berpengalaman. Komunitas kami berkembang dari keberagaman dan shared learning.",
    },
    {
      question: "Ada biaya buat gabung?",
      answer:
        "Membership basic gratis total! Lo dapet akses ke community forums, project showcases, dan networking opportunities. Kami juga ada premium features untuk advanced collaboration tools dan exclusive workshops.",
    },
    {
      question: "Project seperti apa yang bisa di-showcase?",
      answer:
        "Project digital apa aja yang lo banggain! Mau itu personal website, aplikasi SaaS, mobile app, atau eksperimen AI - komunitas kami suka banget liat karya kreatif. Kami support semua tech stack dan encourage innovation.",
    },
    {
      question: "Bisa kolaborasi sama member lain?",
      answer:
        "Kolaborasi itu inti dari komunitas kami. Pakai project boards kami buat cari teammates, join project yang udah ada, atau mulai project lo sendiri. Banyak startup sukses yang lahir dari lingkungan kolaboratif kami.",
    },
    {
      question: "Teknologi apa aja yang didukung?",
      answer:
        "Kami embrace semua teknologi modern! Member kami kerja dengan React, Next.js, Vue, Angular, Node.js, Python, AI/ML frameworks, dan masih banyak lagi. Kalau itu cutting-edge tech, lo pasti nemu expert di sini yang siap bantuin dan kolaborasi.",
    },
    {
      question: "Seberapa aktif komunitasnya?",
      answer:
        "Sangat aktif! Dengan 100+ member aktif dan terus bertambah, selalu ada yang happening. Daily discussions, weekly showcases, monthly workshops, dan ongoing project collaborations bikin komunitas kami buzzing with energy.",
    },
    {
      question: "Ada mentorship atau learning resources?",
      answer:
        "Yes! Member berpengalaman kami regularly mentor newcomers, dan kami host workshops, code reviews, dan tech talks. Plus, project showcase kami jadi learning resource di mana lo bisa study real-world implementations.",
    },
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const handleSignIn = () => {
    router.push("/user/auth")
  }

  const handleJoinWithUs = () => {
    router.push("/user/auth")
  }

  const handleViewShowcase = () => {
    scrollToSection("projects")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Pass real auth state to Navbar */}
      <Navbar showNavigation={true} isLoggedIn={isLoggedIn} user={user} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 mt-0 bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="space-y-12">
            <div className="space-y-8 text-left md:text-center lg:text-center">
              <div
                className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
                style={{
                  filter: "url(#glass-effect)",
                }}
              >
                <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                <span className="text-foreground/90 text-sm font-medium relative z-10 mr-2">✨</span>
                <span className="text-foreground/90 text-sm font-medium relative z-10">200+ Active Members</span>
              </div>

              {/* Add SVG filter for glass effect */}
              <svg className="absolute" width="0" height="0">
                <defs>
                  <filter id="glass-effect">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="1" result="offset" />
                    <feFlood floodColor="rgba(255,255,255,0.1)" />
                    <feComposite in2="offset" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>

              <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-tight leading-10 tracking-tight">
                {["When", "the", "Codes"].map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block mr-3 transition-all duration-700 ease-out leading-3 ${
                      animatedWords.includes(index)
                        ? "opacity-100 translate-y-0 blur-0"
                        : "opacity-0 translate-y-8 blur-sm"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    {word}
                  </span>
                ))}
                <br />
                {["Meet", "the", "Vibes"].map((word, index) => (
                  <span
                    key={index + 3}
                    className={`inline-block mr-3 transition-all duration-700 ease-out leading-3 ${
                      animatedWords.includes(index + 3)
                        ? "opacity-100 translate-y-0 blur-0"
                        : "opacity-0 translate-y-8 blur-sm"
                    }`}
                    style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                  >
                    {word}
                  </span>
                ))}
              </h1>

              <p
                className={`text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-auto lg:mx-auto transition-all duration-700 ease-out ${
                  subtitleVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-sm"
                }`}
              >
                {"Menghubungkan developer, vibe coders, dan AI enthusiasts dengan satu visi dan passion yang sama."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-start md:justify-center lg:justify-center">
                {!isLoggedIn ? (
                  <>
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleJoinWithUs}>
                      <ArrowRight className="h-4 w-4" />
                      Gabung Bersama Kami
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleViewShowcase}>
                      Lihat Showcase Kami
                    </Button>
                  </>
                ) : (
                  <Button size="lg" variant="outline" onClick={handleViewShowcase}>
                    Lihat Showcase Kami
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <Safari url="vibedev.id">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SOLO-pic-EN.35a702ba-uLVDZsjReIz7K4Ecr3JBrYkLCl8cdm.png"
                  alt="Development environment showing SOLO Builder interface with movie website project documentation"
                  className="w-full h-auto object-cover"
                />
              </Safari>
            </div>

            <div className="relative mb-8 mt-12">
              <div className="flex justify-center items-center opacity-90 my-0">
                <AnimatedTooltip items={frameworks} />
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden">{/* Framework logos moved above Safari mockup */}</div>
          </div>
        </div>
      </section>

      {/* Project Showcase Section */}
      <section className="py-12 bg-muted/30" id="projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">Showcase Project</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Temukan project keren yang dibuat oleh komunitas creator dan developer kami
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Filters Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2"
                >
                  Filter
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`} />
                </Button>

                {isFiltersOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      {filterOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedFilter(option)
                            setIsFiltersOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                            selectedFilter === option ? "bg-muted text-foreground" : "text-muted-foreground"
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

            <div className="flex-1 flex justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/project/submit">
                  <Plus className="h-4 w-4 mr-2" />
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
                <ChevronDown className={`h-4 w-4 transition-transform ${isTrendingOpen ? "rotate-180" : ""}`} />
              </Button>

              {isTrendingOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    {trendingOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedTrending(option)
                          setIsTrendingOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                          selectedTrending === option ? "bg-muted text-foreground" : "text-muted-foreground"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="group cursor-pointer py-0 my-4">
                    <div className="relative overflow-hidden rounded-lg bg-muted animate-pulse mb-4">
                      <div className="w-full h-64 bg-muted"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded animate-pulse"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                        </div>
                        <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
              : projects
                  .filter((project) => selectedFilter === "All" || project.category === selectedFilter)
                  .slice(0, visibleProjects)
                  .map((project) => (
                    <div key={project.id} className="group cursor-pointer py-0 my-4">
                      {/* Thumbnail Preview Section */}
                      <div className="relative overflow-hidden rounded-lg bg-background shadow-md hover:shadow-xl transition-all duration-300 mb-4">
                        <AspectRatio ratio={16/9}>
                          <img
                            src={project.image || "/vibedev-guest-avatar.png"}
                            alt={project.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = "/vibedev-guest-avatar.png"
                            }}
                          />
                        </AspectRatio>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button variant="secondary" size="sm" asChild>
                            <a href={`/project/${project.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Project
                            </a>
                          </Button>
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      {/* Project Details Section */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 text-lg py-0">
                          {project.title}
                        </h3>

                        {/* Author and Stats */}
                        <div className="flex items-center justify-between py-0">
                          <div className="flex items-center gap-2.5">
                            <Link
                              href={`/${project.author.username}`}
                              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                            >
                              <OptimizedAvatar
                                src={project.author.avatar}
                                alt={project.author.name}
                                size="sm"
                                className="ring-2 ring-muted"
                                showSkeleton={false}
                              />
                              <span className="text-sm font-medium text-muted-foreground">{project.author.name}</span>
                            </Link>
                          </div>
                          <HeartButton
                            projectId={project.id}
                            initialLikes={likesData[project.id]?.totalLikes || 0}
                            initialIsLiked={likesData[project.id]?.isLiked || false}
                            isLoggedIn={isLoggedIn}
                            onLikeChange={(newLikes, isLiked) => {
                              setLikesData((prev) => ({
                                ...prev,
                                [project.id]: { totalLikes: newLikes, isLiked },
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
          </div>

          {/* Load More button */}
          {!loading &&
            visibleProjects <
              projects.filter((project) => selectedFilter === "All" || project.category === selectedFilter).length && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => setVisibleProjects((prev) => prev + 6)} className="px-8 py-2">
                  Muat Project Lainnya
                </Button>
              </div>
            )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Apa Yang Membedakan Kami
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kami tidak hanya ngoding. Kami menciptakan pengalaman digital yang memberikan hasil nyata.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card
              className={`transition-all duration-700 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Kolaborasi Coding</h3>
                <p className="text-muted-foreground">
                  Ngoding bareng, belajar lebih cepat. Share knowledge, review code, dan bikin project keren bareng sesama developer.
                </p>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-700 delay-150 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tech Stack Modern</h3>
                <p className="text-muted-foreground">
                  Selalu terdepan dengan teknologi cutting-edge. Dari React sampai AI, eksplor tools terbaru dengan panduan expert.
                </p>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-700 delay-300 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Komunitas Global</h3>
                <p className="text-muted-foreground">
                  Koneksi worldwide sama creator yang passionate. Networking, kolaborasi, dan kembangkan karir lo dengan berbagai talent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 bg-muted/30" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Kata Member Kami</h2>
            <p className="text-xl text-muted-foreground">Hasil nyata dari para founder asli</p>
          </div>

          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
            <TestimonialsColumns testimonials={testimonials.slice(0, 3)} duration={15} />
            <TestimonialsColumns testimonials={testimonials.slice(3, 6)} className="hidden md:block" duration={19} />
            <TestimonialsColumns testimonials={testimonials.slice(6, 9)} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20" data-animate>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Semua yang perlu lo tau tentang gabung di komunitas kami</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className={`transition-all duration-700 cursor-pointer hover:shadow-md ${isVisible.faq ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => toggleFAQ(index)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-left">{faq.question}</h3>
                    <div className="transition-transform duration-300 flex-shrink-0 ml-4">
                      {openFAQ === index ? (
                        <Minus className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      openFAQ === index ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-muted-foreground leading-relaxed text-left">{faq.answer}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-muted text-foreground overflow-hidden" data-animate>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-gradient-to-br from-background via-muted to-card"
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
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Row */}
          <div className="absolute top-16 left-16 w-32 h-24 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform rotate-12 animate-pulse">
            <div className="p-3">
              <div className="w-full h-3 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="w-2/3 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          <div className="absolute top-20 right-20 w-28 h-20 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform -rotate-6 animate-pulse delay-300">
            <div className="p-2">
              <div className="w-full h-2 bg-muted-foreground/20 rounded mb-1"></div>
              <div className="w-3/4 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          {/* Middle Row */}
          <div className="absolute top-1/2 left-8 w-36 h-28 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform rotate-6 animate-pulse delay-500">
            <div className="p-3">
              <div className="w-full h-4 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="w-1/2 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          <div className="absolute top-1/2 right-12 w-32 h-24 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform -rotate-12 animate-pulse delay-700">
            <div className="p-3">
              <div className="w-full h-3 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="w-4/5 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="absolute bottom-16 left-24 w-30 h-22 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform rotate-3 animate-pulse delay-1000">
            <div className="p-2">
              <div className="w-full h-2 bg-muted-foreground/20 rounded mb-1"></div>
              <div className="w-2/3 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          <div className="absolute bottom-20 right-16 w-34 h-26 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform -rotate-8 animate-pulse delay-1200">
            <div className="p-3">
              <div className="w-full h-3 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="w-3/4 h-2 bg-muted-foreground/15 rounded"></div>
            </div>
          </div>

          {/* Additional floating elements */}
          <div className="absolute top-32 left-1/3 w-24 h-18 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform rotate-45 animate-pulse delay-200"></div>
          <div className="absolute bottom-32 right-1/3 w-28 h-20 bg-card/20 rounded-lg backdrop-blur-sm border border-border/20 transform -rotate-30 animate-pulse delay-800"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4 font-mono tracking-wider">
              {isMounted ? currentTime : "--:--:--"}
            </p>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
              Gabung Bareng
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/60 to-accent dark:from-primary dark:via-accent-foreground dark:to-primary bg-clip-text text-transparent">
                Developer Kece Lainnya
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Siap konek sama developer dan creator yang sepikiran? Gabung komunitas vibrant kami dan ayo bikin hal-hal keren bareng!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Gabung Komunitas Sekarang
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">© 2025 VibeDev ID. All Rights Reserved.</div>
            <div className="flex space-x-6 text-sm">
              <Drawer open={isPrivacyDrawerOpen} onOpenChange={setIsPrivacyDrawerOpen}>
                <DrawerTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">Privacy Policy</button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-4xl">
                    <DrawerHeader>
                      <DrawerTitle>Privacy Policy</DrawerTitle>
                      <DrawerDescription>Last updated: August 2025</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground hover:scrollbar-thumb-foreground scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                      <div className="space-y-6 text-sm">
                        <section>
                          <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
                          <p className="text-muted-foreground mb-2">
                            At VibeDev ID, we collect information you provide directly to us, such as when you
                            create an account, participate in community discussions, or contact us for support.
                          </p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>Account information (username, email address, profile details)</li>
                            <li>Community contributions (posts, comments, project submissions)</li>
                            <li>Communication data when you contact our support team</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
                          <p className="text-muted-foreground mb-2">
                            We use the information we collect to provide, maintain, and improve our community platform:
                          </p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>Facilitate community interactions and project collaborations</li>
                            <li>Send important updates about platform changes or community events</li>
                            <li>Provide customer support and respond to your inquiries</li>
                            <li>Improve our services based on usage patterns and feedback</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
                          <p className="text-muted-foreground mb-2">
                            We do not sell, trade, or otherwise transfer your personal information to third parties
                            without your consent, except in the following circumstances:
                          </p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>With your explicit consent for specific integrations or features</li>
                            <li>To comply with legal obligations or protect our rights</li>
                            <li>With trusted service providers who assist in operating our platform</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
                          <p className="text-muted-foreground">
                            We implement appropriate security measures to protect your personal information against
                            unauthorized access, alteration, disclosure, or destruction. However, no method of
                            transmission over the internet is 100% secure.
                          </p>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">5. Community Guidelines</h3>
                          <p className="text-muted-foreground">
                            As a member of VibeDev ID, you agree to maintain respectful interactions, share
                            knowledge constructively, and contribute to a positive learning environment for all
                            developers in our community.
                          </p>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
                          <p className="text-muted-foreground mb-2">You have the right to:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                            <li>Access and update your personal information</li>
                            <li>Delete your account and associated data</li>
                            <li>Opt out of non-essential communications</li>
                            <li>Request a copy of your data</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="font-semibold text-base mb-2">7. Contact Us</h3>
                          <p className="text-muted-foreground">
                            If you have any questions about this Privacy Policy or our data practices, please contact us
                            at privacy@vibedev.id or through our community support channels.
                          </p>
                        </section>
                      </div>
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
