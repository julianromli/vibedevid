'use client'

import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'

interface ClientThemeProviderProps {
  children: React.ReactNode
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Server-side: render children without theme provider to avoid hydration mismatch
    return <>{children}</>
  }

  // Client-side: render with theme provider after component is mounted
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}