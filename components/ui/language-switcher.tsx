'use client'

import { Globe } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type Locale, routing } from '@/i18n/routing'

const localeLabels: Record<Locale, { label: string; flag: string }> = {
  id: { label: 'Bahasa Indonesia', flag: '🇮🇩' },
  en: { label: 'English', flag: '🇬🇧' },
}

function getLocaleFromPathname(pathname: string): Locale {
  for (const loc of routing.locales) {
    if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
      return loc
    }
  }
  return routing.defaultLocale
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Derive current locale from pathname instead of using useLocale hook
  const locale = getLocaleFromPathname(pathname)

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return

    // Remove current locale prefix if present
    let newPath = pathname

    // Check if path starts with a locale prefix
    for (const loc of routing.locales) {
      if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
        newPath = pathname.slice(`/${loc}`.length) || '/'
        break
      }
    }

    // Add new locale prefix (except for default locale which uses root)
    const finalPath = newLocale === routing.defaultLocale ? newPath : `/${newLocale}${newPath}`

    // Force hard navigation to ensure middleware runs and cookies are set correctly
    // This resolves the issue where page content doesn't update immediately on language switch
    window.location.href = finalPath
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={loc === locale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeLabels[loc].flag}</span>
            {localeLabels[loc].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
