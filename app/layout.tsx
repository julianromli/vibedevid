import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Instrument_Serif } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css"

// Critical font - load with highest priority
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

// Secondary font - lazy load untuk performance
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono", 
  display: "swap",
  preload: false,
  fallback: ['menlo', 'monaco', 'consolas'],
  adjustFontFallback: true,
})

// Optional font - lazy load untuk reduce initial payload
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
  fallback: ['georgia', 'times'],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: {
    default: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia | Coding Pake AI",
    template: "%s | VibeDev ID",
  },
  description:
    "Gabung VibeDev ID, komunitas vibe coding Indonesia. Belajar coding pake AI, kolab di project open source, dan ketemu vibe coder Indonesia. Event rutin + support komunitas.",
  applicationName: "VibeDev ID",
  generator: "VibeDev ID",
  keywords: [
    "vibe coding",
    "komunitas vibe coding", 
    "komunitas vibe coding indonesia",
    "vibe coder indonesia",
    "coding pake AI",
    "AI untuk coding",
    "komunitas developer indonesia",
    "open source indonesia",
    "belajar coding AI",
    "developer community indonesia",
    "project showcase indonesia",
  ],
  category: "technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://vibedevid.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia",
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
    card: "summary_large_image", 
    title: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia",
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
    icon: "/vibedev-guest-avatar.png",
    shortcut: "/vibedev-guest-avatar.png", 
    apple: "/vibedev-guest-avatar.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
      <head>
        {/* Critical Resource Hints untuk faster LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://qabfrhpbfvjcgdrxdlba.supabase.co" />
        <link rel="preconnect" href="https://vercel.live" />
        
        {/* Critical images preload */}
        <link rel="preload" href="/vibedevid_final_black.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/vibedevid_final_white.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/vibedev-guest-avatar.png" as="image" />
        
        {/* DNS prefetch untuk external resources */}
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="//utfs.io" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
      </head>
      <body suppressHydrationWarning={true}>
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
      </body>
    </html>
  )
}
