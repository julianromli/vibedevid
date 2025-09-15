import type React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Instrument_Serif } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { siteConfig } from '@/config/site'
import { geist, geistMono, instrumentSerif } from './font'
import { ThemeProvider } from 'next-themes'

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.author,
  generator: siteConfig.author,
  keywords: siteConfig.keywords,
  category: 'technology',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://vibedevid.com',
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia',
    description:
      "Komunitas vibe coding Indonesia: belajar coding pake AI, project open source, event rutin.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://vibedevid.com",
    siteName: "VibeDev ID",
    images: [{ 
      url: "/komunitasvibecodingno1diindonesia.jpg",
      width: 1200,
      height: 630,
      alt: "Komunitas Vibe Coding Indonesia"
    }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia',
    description:
      "Belajar coding pake AI bareng komunitas vibe coding Indonesia.",
    images: ["/komunitasvibecodingno1diindonesia.jpg"],
    creator: "@vibedevid",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Critical Resource Hints untuk faster LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://qabfrhpbfvjcgdrxdlba.supabase.co"
        />
        <link rel="preconnect" href="https://vercel.live" />

        {/* Critical images preload */}
        <link
          rel="preload"
          href="/vibedevid_final_black.svg"
          as="image"
          type="image/svg+xml"
        />
        <link
          rel="preload"
          href="/vibedevid_final_white.svg"
          as="image"
          type="image/svg+xml"
        />
        <link rel="preload" href="/vibedev-guest-avatar.png" as="image" />

        {/* DNS prefetch untuk external resources */}
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="//utfs.io" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider
          attribute={'class'}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
          <SpeedInsights />

          {/* Service Worker Registration untuk Mobile Performance */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
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
            `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
