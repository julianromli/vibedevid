import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type React from 'next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { AgentationProvider } from '@/components/agentation-provider'
import { ClientThemeProvider } from '@/components/client-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { getSiteUrl } from '@/lib/seo/site-url'
import './globals.css'

// Critical font - load with highest priority
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

// Secondary font - lazy load untuk performance
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
  fallback: ['menlo', 'monaco', 'consolas'],
  adjustFontFallback: true,
})

// Optional font - lazy load untuk reduce initial payload
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
  fallback: ['georgia', 'times'],
  adjustFontFallback: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const siteUrl = getSiteUrl()

  return {
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    applicationName: 'VibeDev ID',
    generator: 'VibeDev ID',
    keywords: [
      'vibe coding',
      'komunitas vibe coding',
      'komunitas vibe coding indonesia',
      'vibe coder indonesia',
      'coding pake AI',
      'AI untuk coding',
      'komunitas developer indonesia',
      'open source indonesia',
      'belajar coding AI',
      'developer community indonesia',
      'project showcase indonesia',
    ],
    category: 'technology',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: siteUrl,
      siteName: 'VibeDev ID',
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('twitterDescription'),
      images: ['/opengraph-image.png'],
      site: '@vibedevid',
      creator: '@vibedevid',
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/vibedev-guest-avatar.png',
      shortcut: '/vibedev-guest-avatar.png',
      apple: '/vibedev-guest-avatar.png',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const siteUrl = getSiteUrl()
  const shouldLoadVercelInsights = process.env.VERCEL === '1'

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <head>
        {/* React Grab - Dev only element picker for AI coding */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}

        {/* Critical Resource Hints untuk faster LCP */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://qabfrhpbfvjcgdrxdlba.supabase.co"
        />
        <link
          rel="preconnect"
          href="https://vercel.live"
        />

        {/* DNS prefetch untuk external resources */}
        <link
          rel="dns-prefetch"
          href="//cdn.jsdelivr.net"
        />
        <link
          rel="dns-prefetch"
          href="//utfs.io"
        />
        <link
          rel="dns-prefetch"
          href="//lh3.googleusercontent.com"
        />

        {/* JSON-LD: Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VibeDev ID',
            url: siteUrl,
            logo: `${siteUrl}/vibedevid_final_black.svg`,
            sameAs: ['https://x.com/vibedevid'],
          })}
        </script>

        {/* JSON-LD: WebSite */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'VibeDev ID',
            url: siteUrl,
            inLanguage: 'id-ID',
            potentialAction: [
              // Add SearchAction here if/when site search is available
            ],
          })}
        </script>
      </head>
      <body suppressHydrationWarning={true}>
        <NextIntlClientProvider>
          <ClientThemeProvider>
            {children}
            <Toaster />
          </ClientThemeProvider>
        </NextIntlClientProvider>
        <AgentationProvider />
        {shouldLoadVercelInsights && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}

        {/* Service Worker Registration untuk Mobile Performance */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
        >
          {`
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('[SW] Registration successful:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('[SW] Registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
