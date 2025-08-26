import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Instrument_Serif } from "next/font/google"
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
    default: "VibeDev ID — Indonesia’s Vibe Coders & Developer Community",
    template: "%s | VibeDev ID",
  },
  description:
    "VibeDev ID is Indonesia’s home for vibe coders and developers. Showcase projects, get feedback, collaborate on open source, and level up across web, mobile, and AI.",
  applicationName: "VibeDev ID",
  generator: "VibeDev ID",
  keywords: [
    "VibeDev ID",
    "VibeDev",
    "developer community Indonesia",
    "Indonesian developers",
    "vibe coders",
    "project showcase",
    "open source collaboration",
    "Next.js community",
    "Supabase",
    "shadcn/ui",
  ],
  category: "technology",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VibeDev ID — Indonesia’s Vibe Coders & Developer Community",
    description:
      "VibeDev ID is Indonesia’s home for vibe coders and developers. Showcase projects, get feedback, collaborate on open source, and level up across web, mobile, and AI.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "VibeDev ID",
    images: [{ url: "/vibedev-guest-avatar.png" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeDev ID — Indonesia’s Vibe Coders & Developer Community",
    description:
      "VibeDev ID is Indonesia’s home for vibe coders and developers. Showcase projects, get feedback, collaborate on open source, and level up across web, mobile, and AI.",
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
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
