import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'

// Critical font - load with highest priority
export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
})

// Secondary font - lazy load untuk performance
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
  fallback: ['menlo', 'monaco', 'consolas'],
  adjustFontFallback: true,
})

// Optional font - lazy load untuk reduce initial payload
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
  fallback: ['georgia', 'times'],
  adjustFontFallback: true,
})
