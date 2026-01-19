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
