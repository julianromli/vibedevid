/**
 * Intersection Observer hook for scroll animations
 */

import { useState, useEffect } from 'react'

interface VisibilityState {
  [key: string]: boolean
}

export function useIntersectionObserver() {
  const [isVisible, setIsVisible] = useState<VisibilityState>({
    hero: false,
    features: false,
    projects: false,
    testimonials: false,
    cta: false,
    faq: false,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }))
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return isVisible
}
