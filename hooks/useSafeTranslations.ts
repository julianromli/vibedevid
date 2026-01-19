'use client'

import { useMemo } from 'react'

// All translations for both locales
const translations: Record<string, Record<string, Record<string, string | string[]>>> = {
  id: {
    common: {
      signIn: 'Masuk',
      signOut: 'Keluar',
      profile: 'Profil',
      myPosts: 'Postingan Saya',
      write: 'Tulis',
      writePost: 'Tulis Postingan',
    },
    navbar: {
      projects: 'Projects',
      blog: 'Blog',
      showcase: 'Showcase',
      features: 'Fitur',
      reviews: 'Ulasan',
      faq: 'FAQ',
    },
    hero: {
      announcement: 'Fitur Baru: Blog VibeDev ID',
      readLatest: 'Baca Artikel Terbaru →',
      titleLine1: ['Komunitas', 'Vibe', 'Coding'],
      titleLine2: ['No.', '1', 'di', 'Indonesia'],
      subtitle:
        'Komunitas vibe coding Indonesia buat lo yang pengen naik level, belajar coding pake AI, kolaborasi project open source, dan sharing session tiap minggunya.',
      joinCommunity: 'Join Community',
      ourShowcase: 'Our Showcase',
    },
    toast: {
      signOutSuccess: 'Berhasil keluar! Sampai jumpa lagi!',
      signOutError: 'Gagal keluar. Coba lagi!',
      generalError: 'Terjadi kesalahan saat keluar',
    },
    projectShowcase: {
      title: 'Showcase Project Developer Indonesia',
      description:
        'Temukan project keren yang dibuat oleh komunitas vibe coder Indonesia. Dari AI tools sampai open source projects, semua karya developer terbaik ada di sini.',
      submitButton: 'Submit Project',
      loadMoreButton: 'Muat Project Lainnya',
    },
    youtubeShowcase: {
      title: 'Video Vibe Coding Terbaru',
      description:
        'Nonton video tutorial, live coding session, dan podcast tech terbaru dari komunitas Vibe Coding Indonesia.',
      viewAll: 'Lihat Semua Video di Channel Kami',
      watch: 'Tonton',
      error: 'Gagal memuat video. Coba refresh halaman ya!',
    },
    features: {
      title: 'Kenapa Gabung VibeDev ID?',
      subtitle:
        'Komunitas vibe coding Indonesia yang supportive, kolaboratif, dan siap bantu lo berkembang jadi developer yang lebih baik',
      'stats.title': 'Vibe Coder Aktif',
      'trusted.title': 'Komunitas Terpercaya',
      'trusted.description': 'Diskusi berkualitas, networking real, dan kolaborasi yang meaningful.',
      'levelUp.title': 'Level Up Bareng',
      'levelUp.description': 'Tracking progress coding lo, share achievement, dan liat gimana skill lo berkembang.',
      'safeSpace.title': 'Safe Space untuk Belajar',
      'safeSpace.description':
        'Environment supportive buat semua level. Mau pemula atau expert, semua saling bantu dan grow together.',
      'collaboration.title': 'Kolaborasi Tanpa Batas',
      'collaboration.description': 'Bikin project bareng, share knowledge, dan build something amazing together.',
    },
    aiLeaderboard: {
      badge: 'Live Rankings',
      title: 'Benchmark AI Coding Model 2025',
      // Note: description contains HTML tags in messages.json, simplified here for text-only safety if needed,
      // but we will use rich text handling in component if possible or just string replacement
      description: 'Ranking model AI untuk coding berdasarkan LiveCodeBench, SciCode, dan Terminal-Bench Hard',
      'attribution.title': 'Data from Artificial Analysis',
      'attribution.subtitle': 'Independent AI model benchmarking',
      viewFull: 'View Full Rankings',
      score: 'SCORE',
    },
    aiTools: {
      title: 'AI untuk Coding & Development Tools',
      description:
        'Explore tools AI terbaru untuk coding pake AI yang lebih efisien. Integrasikan AI coding agents favorit untuk workflow development yang next-level.',
      'tools.lovable.description':
        'AI co-engineer yang build full-stack apps dari single prompt. Integrates dengan auth, payments, dan databases otomatis.',
      'tools.v0.description':
        'AI-powered design-to-code platform yang convert ideas jadi functional apps. Rapid prototyping dengan visual interface builder.',
      'tools.openai.description':
        'AI programming assistant yang bisa generate, explain, dan debug code. Supports multiple languages dengan natural language interface.',
      'tools.cursor.description':
        'AI-powered code editor yang understand codebase lo. Natural language to code dengan intelligent completion dan real-time suggestions.',
      'tools.warp.description':
        'Modern terminal dengan Active AI features, command suggestions, dan intelligent autocompletion untuk workflow yang lebih efficient.',
      'tools.trae.description':
        'AI-powered development framework yang accelerate project creation dengan intelligent code generation dan automation tools.',
    },
    reviews: {
      title: 'Review Member Komunitas Vibe Coding',
      subtitle: 'Testimoni asli dari developer Indonesia yang udah join komunitas kami',
      'testimonials.0.text':
        'VibeDev ID ngubah cara gue belajar coding! Dari yang tadinya stuck sendirian, sekarang punya temen-temen yang solid buat diskusi dan kolaborasi project. Networking di sini top banget!',
      'testimonials.0.role': 'Frontend Developer, Tokopedia',
      'testimonials.1.text':
        'Komunitas yang benar-benar supportive! Gue berhasil launch startup fintech pertama gue berkat feedback dan mentorship dari senior developer di VibeDev ID. Game changer banget!',
      'testimonials.1.role': 'Founder, PayKita',
      'testimonials.2.text':
        'Sebagai fresh graduate, VibeDev ID kasih gue exposure ke real-world projects dan code review yang berkualitas. Sekarang gue udah confident kerja di tech company besar.',
      'testimonials.2.role': 'Backend Developer, Gojek',
      'testimonials.3.text':
        'Project showcase di VibeDev ID jadi portfolio terbaik gue. Banyak recruiter yang approach gue setelah liat karya-karya yang gue share di platform ini.',
      'testimonials.3.role': 'Full Stack Developer, Bukalapak',
      'testimonials.4.text':
        'Dari hobby project jadi bisnis yang profitable! Kolaborasi sama member VibeDev ID bikin gue nemuin co-founder yang tepat dan sekarang startup kami udah dapetin seed funding.',
      'testimonials.4.role': 'CTO, EduTech Solutions',
      'testimonials.5.text':
        'Workshop dan tech talk di VibeDev ID selalu update dengan teknologi terbaru. Gue bisa ngikutin trend React, Next.js, sampai AI development berkat komunitas ini.',
      'testimonials.5.role': 'Senior React Developer, Traveloka',
    },
    faq: {
      title: 'FAQ Komunitas Vibe Coding Indonesia',
      subtitle: 'Semua yang perlu lo tau tentang gabung di komunitas vibe coder Indonesia terbesar',
      'items.0.question': 'Apa itu VibeDev ID?',
      'items.0.answer':
        'VibeDev ID adalah komunitas vibe coding Indonesia No. 1 untuk developer, AI enthusiasts, dan tech innovators yang punya visi sama untuk bikin produk digital keren. Kami menghubungkan vibe coder Indonesia yang sepikiran untuk kolaborasi, belajar coding pake AI, dan berkembang bareng.',
      'items.1.question': 'Gimana cara gabung komunitas vibe coding ini?',
      'items.1.answer':
        "Gabung komunitas vibe coding Indonesia gampang banget! Klik tombol 'Gabung Komunitas Gratis' dan lengkapi profil lo. Kami welcome developer dari semua level - dari pemula yang baru belajar coding pake AI sampai professional berpengalaman.",
      'items.2.question': 'Ada biaya untuk join komunitas vibe coding Indonesia?',
      'items.2.answer':
        'Membership basic di komunitas vibe coding kami 100% gratis! Lo dapet akses ke community forums, project showcases, networking opportunities, dan belajar coding pake AI bareng member lain. Semua fitur inti gratis untuk semua vibe coder Indonesia.',
      'items.3.question': 'Bisa kolaborasi project dengan member lain?',
      'items.3.answer':
        'Kolaborasi itu inti dari komunitas vibe coding kami! Lo bisa cari teammates untuk coding pake AI, join project open source yang udah ada, atau mulai project lo sendiri. Banyak vibe coder Indonesia di sini yang udah sukses bikin startup bareng.',
      'items.4.question': 'Teknologi dan AI tools apa aja yang didukung?',
      'items.4.answer':
        'Komunitas vibe coding Indonesia kami embrace semua teknologi modern! Member aktif kerja dengan React, Next.js, Python, AI/ML frameworks, dan tools untuk coding pake AI seperti GitHub Copilot, ChatGPT, dan Claude. Kalau itu cutting-edge tech, lo pasti nemu expert vibe coder di sini.',
    },
    cta: {
      titleLine1: 'Siap Jadi Bagian',
      titleLine2: 'Komunitas Vibe Coding Indonesia?',
      description:
        'Join sekarang dan nikmatin vibe coding terbaik bareng developer Indonesia lainnya. Gratis, supportive, dan penuh kolaborasi!',
      button: 'Join Community',
    },
    footer: {
      copyright: '© 2025 VibeDev ID - Komunitas vibe coding Indonesia terbesar untuk developer masa depan.',
      privacy: 'Privacy Policy',
      close: 'Tutup',
    },
  },
  en: {
    common: {
      signIn: 'Sign In',
      signOut: 'Sign Out',
      profile: 'Profile',
      myPosts: 'My Posts',
      write: 'Write',
      writePost: 'Write a Post',
    },
    navbar: {
      projects: 'Projects',
      blog: 'Blog',
      showcase: 'Showcase',
      features: 'Features',
      reviews: 'Reviews',
      faq: 'FAQ',
    },
    hero: {
      announcement: 'New Feature: VibeDev ID Blog',
      readLatest: 'Read Latest Articles →',
      titleLine1: ['Vibe', 'Coding', 'Community'],
      titleLine2: ['#1', 'in', 'Indonesia'],
      subtitle:
        "Indonesia's vibe coding community for those who want to level up, learn AI-powered coding, collaborate on open source projects, and join weekly sharing sessions.",
      joinCommunity: 'Join Community',
      ourShowcase: 'Our Showcase',
    },
    toast: {
      signOutSuccess: 'Successfully signed out! See you again!',
      signOutError: 'Failed to sign out. Please try again!',
      generalError: 'An error occurred',
    },
    projectShowcase: {
      title: 'Indonesian Developer Project Showcase',
      description:
        'Discover cool projects created by the Indonesian vibe coder community. From AI tools to open source projects, all the best developer works are here.',
      submitButton: 'Submit Project',
      loadMoreButton: 'Load More Projects',
    },
    youtubeShowcase: {
      title: 'Latest Vibe Coding Videos',
      description:
        'Watch the latest tutorials, live coding sessions, and tech podcasts from the Vibe Coding Indonesia community.',
      viewAll: 'View All Videos on Our Channel',
      watch: 'Watch',
      error: 'Failed to load videos. Please try refreshing the page!',
    },
    features: {
      title: 'Why Join VibeDev ID?',
      subtitle:
        'A supportive, collaborative Indonesian vibe coding community ready to help you grow into a better developer',
      'stats.title': 'Active Vibe Coders',
      'trusted.title': 'Trusted Community',
      'trusted.description': 'Quality discussions, real networking, and meaningful collaboration.',
      'levelUp.title': 'Level Up Together',
      'levelUp.description': 'Track your coding progress, share achievements, and see your skills grow.',
      'safeSpace.title': 'Safe Space to Learn',
      'safeSpace.description':
        'Supportive environment for all levels. Whether beginner or expert, everyone helps each other grow together.',
      'collaboration.title': 'Limitless Collaboration',
      'collaboration.description': 'Build projects together, share knowledge, and build something amazing together.',
    },
    aiLeaderboard: {
      badge: 'Live Rankings',
      title: 'AI Coding Model Benchmark 2025',
      description: 'AI coding model rankings based on LiveCodeBench, SciCode, and Terminal-Bench Hard',
      'attribution.title': 'Data from Artificial Analysis',
      'attribution.subtitle': 'Independent AI model benchmarking',
      viewFull: 'View Full Rankings',
      score: 'SCORE',
    },
    aiTools: {
      title: 'AI for Coding & Development Tools',
      description:
        'Explore the latest AI tools for more efficient AI-powered coding. Integrate your favorite AI coding agents for a next-level development workflow.',
      'tools.lovable.description':
        'AI co-engineer that builds full-stack apps from a single prompt. Integrates with auth, payments, and databases automatically.',
      'tools.v0.description':
        'AI-powered design-to-code platform that converts ideas into functional apps. Rapid prototyping with a visual interface builder.',
      'tools.openai.description':
        'AI programming assistant that can generate, explain, and debug code. Supports multiple languages with a natural language interface.',
      'tools.cursor.description':
        'AI-powered code editor that understands your codebase. Natural language to code with intelligent completion and real-time suggestions.',
      'tools.warp.description':
        'Modern terminal with Active AI features, command suggestions, and intelligent autocompletion for a more efficient workflow.',
      'tools.trae.description':
        'AI-powered development framework that accelerates project creation with intelligent code generation and automation tools.',
    },
    reviews: {
      title: 'Vibe Coding Community Member Reviews',
      subtitle: 'Real testimonials from Indonesian developers who have joined our community',
      'testimonials.0.text':
        'VibeDev ID changed how I learn coding! From being stuck alone, now I have solid friends for discussion and project collaboration. Networking here is top-notch!',
      'testimonials.0.role': 'Frontend Developer, Tokopedia',
      'testimonials.1.text':
        'A truly supportive community! I successfully launched my first fintech startup thanks to feedback and mentorship from senior developers at VibeDev ID. A real game changer!',
      'testimonials.1.role': 'Founder, PayKita',
      'testimonials.2.text':
        "As a fresh graduate, VibeDev ID gave me exposure to real-world projects and quality code reviews. Now I'm confident working at a big tech company.",
      'testimonials.2.role': 'Backend Developer, Gojek',
      'testimonials.3.text':
        'The project showcase at VibeDev ID became my best portfolio. Many recruiters approached me after seeing the works I shared on this platform.',
      'testimonials.3.role': 'Full Stack Developer, Bukalapak',
      'testimonials.4.text':
        'From hobby project to profitable business! Collaborating with VibeDev ID members helped me find the right co-founder and now our startup has secured seed funding.',
      'testimonials.4.role': 'CTO, EduTech Solutions',
      'testimonials.5.text':
        'Workshops and tech talks at VibeDev ID are always up to date with the latest tech. I can keep up with React, Next.js, and AI development trends thanks to this community.',
      'testimonials.5.role': 'Senior React Developer, Traveloka',
    },
    faq: {
      title: 'Vibe Coding Indonesia Community FAQ',
      subtitle: 'Everything you need to know about joining the largest Indonesian vibe coder community',
      'items.0.question': 'What is VibeDev ID?',
      'items.0.answer':
        'VibeDev ID is the #1 Indonesian vibe coding community for developers, AI enthusiasts, and tech innovators who share a vision to create cool digital products. We connect like-minded Indonesian vibe coders to collaborate, learn coding with AI, and grow together.',
      'items.1.question': 'How do I join this vibe coding community?',
      'items.1.answer':
        "Joining the Indonesian vibe coding community is super easy! Click the 'Join Community' button and complete your profile. We welcome developers of all levels - from beginners just learning to code with AI to experienced professionals.",
      'items.2.question': 'Is there a cost to join the Indonesian vibe coding community?',
      'items.2.answer':
        'Basic membership in our vibe coding community is 100% free! You get access to community forums, project showcases, networking opportunities, and learning to code with AI alongside other members. All core features are free for all Indonesian vibe coders.',
      'items.3.question': 'Can I collaborate on projects with other members?',
      'items.3.answer':
        'Collaboration is the core of our vibe coding community! You can find teammates to code with AI, join existing open source projects, or start your own project. Many Indonesian vibe coders here have successfully built startups together.',
      'items.4.question': 'What technology and AI tools are supported?',
      'items.4.answer':
        "Our Indonesian vibe coding community embraces all modern technologies! Active members work with React, Next.js, Python, AI/ML frameworks, and AI coding tools like GitHub Copilot, ChatGPT, and Claude. If it's cutting-edge tech, you'll surely find expert vibe coders here.",
    },
    cta: {
      titleLine1: 'Ready to Be Part of',
      titleLine2: 'Vibe Coding Indonesia Community?',
      description:
        'Join now and enjoy the best vibe coding experience with other Indonesian developers. Free, supportive, and full of collaboration!',
      button: 'Join Community',
    },
    footer: {
      copyright: '© 2025 VibeDev ID - The largest Indonesian vibe coding community for future developers.',
      privacy: 'Privacy Policy',
      close: 'Close',
    },
  },
}

function getLocaleFromCookie(): string {
  if (typeof document === 'undefined') return 'id'
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
  return match ? match[1] : 'id'
}

type TranslationFunction = {
  (key: string): string
  raw: (key: string) => string | string[]
}

export function useSafeTranslations(namespace?: string): TranslationFunction {
  const locale = useMemo(() => getLocaleFromCookie(), [])
  const localeTranslations = translations[locale] || translations.id

  const translationFn = useMemo(() => {
    const fn = ((key: string) => {
      // Handle both "namespace.key" and just "key" format
      const parts = key.split('.')
      let ns: string
      let actualKey: string

      if (parts.length === 1) {
        ns = namespace || 'common'
        actualKey = key
      } else {
        ns = parts[0]
        actualKey = parts.slice(1).join('.')
      }

      const nsTranslations = localeTranslations[ns]
      if (!nsTranslations) return key

      const value = nsTranslations[actualKey]
      return typeof value === 'string' ? value : Array.isArray(value) ? value.join(' ') : key
    }) as TranslationFunction

    fn.raw = (key: string) => {
      const parts = key.split('.')
      let ns: string
      let actualKey: string

      if (parts.length === 1) {
        ns = namespace || 'common'
        actualKey = key
      } else {
        ns = parts[0]
        actualKey = parts.slice(1).join('.')
      }

      const nsTranslations = localeTranslations[ns]
      if (!nsTranslations) return key

      return nsTranslations[actualKey] ?? key
    }

    return fn
  }, [namespace, localeTranslations])

  return translationFn
}
