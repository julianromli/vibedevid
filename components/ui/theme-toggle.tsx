'use client'

import { Moon, SunDim } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from './button'

type props = {
  className?: string
}

export const ThemeToggle = ({ className }: props) => {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return

  const changeTheme = async () => {
    if (!buttonRef.current || !mounted) return

    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    // Check if browser supports view transitions
    if (!document.startViewTransition) {
      setTheme(newTheme)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const y = top + height / 2
    const x = left + width / 2

    const right = window.innerWidth - left
    const bottom = window.innerHeight - top
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom))

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  // Dont render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className={cn('opacity-0', className)} disabled>
        <Moon />
      </button>
    )
  }

  return (
    <Button
      variant={'ghost'}
      ref={buttonRef}
      onClick={changeTheme}
      size={'icon'}
      className={cn(
        'rounded-full transition-opacity duration-200 hover:cursor-pointer hover:opacity-80 focus:outline-none',
        className,
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <SunDim className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  )
}
