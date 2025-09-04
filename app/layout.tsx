import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Instrument_Serif } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VibeDev ID — Komunitas Vibe Coding No. 1 di Indonesia",
    description:
      "Komunitas vibe coding Indonesia: belajar coding pake AI, project open source, event rutin.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "VibeDev ID",
    images: [{ 
      url: "/vibedev-guest-avatar.png",
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
    images: ["/vibedev-guest-avatar.png"],
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
      <body suppressHydrationWarning={true}>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
