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
  title: "Trae Community ID",
  description: "Join the most innovative developer community in Indonesia",
  generator: "v0.app",
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trae-color-glPzZeyKiOpfe7lJ0rYz78T4WDdPS9.svg",
    shortcut: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trae-color-glPzZeyKiOpfe7lJ0rYz78T4WDdPS9.svg",
    apple: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/trae-color-glPzZeyKiOpfe7lJ0rYz78T4WDdPS9.svg",
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
