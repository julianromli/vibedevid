'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer className="bg-muted/50 border-border relative border-t py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="text-muted-foreground mb-4 text-sm md:mb-0">{t('copyright')}</div>
          <div className="flex space-x-6 text-sm">
            <Link
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground"
            >
              {t('privacy')}
            </Link>
            <Link
              href="/terms-of-service"
              className="text-muted-foreground hover:text-foreground"
            >
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
