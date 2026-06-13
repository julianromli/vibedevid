'use client'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { type ReactNode, useRef } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({ children, delay = 0, duration = 0.5, className, once = true }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
      animate={prefersReducedMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration, delay: Math.min(delay, 0.5), ease: [0.2, 0, 0, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ children, className, staggerDelay = 0.08 }: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion || isInView ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: Math.min(staggerDelay, 0.06),
            delayChildren: 0,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.2, 0, 0, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface ScaleInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
      animate={prefersReducedMotion || isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration: 0.36, delay: Math.min(delay, 0.5), ease: [0.2, 0, 0, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  )
}
