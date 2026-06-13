'use client'

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import Image from 'next/image'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number
    name: string
    designation: string
    image: string
  }[]
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const springConfig = { stiffness: 300, damping: 24 }
  const x = useMotionValue(0)
  const animationFrameRef = useRef<number | null>(null)

  const rotate = useSpring(useTransform(x, [-100, 100], [-8, 8]), springConfig)
  const translateX = useSpring(useTransform(x, [-100, 100], [-12, 12]), springConfig)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (prefersReducedMotion) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const halfWidth = event.currentTarget.offsetWidth / 2
    const offsetX = event.nativeEvent.offsetX

    animationFrameRef.current = requestAnimationFrame(() => {
      x.set(offsetX - halfWidth)
    })
  }

  return (
    <>
      {items.map((item) => (
        <button
          type="button"
          className="group relative mr-2 border-0 bg-transparent p-0"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
          onFocus={() => setHoveredIndex(item.id)}
          onBlur={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: prefersReducedMotion ? 0.08 : 0.12,
                    ease: [0.2, 0, 0, 1],
                  },
                }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.08, ease: [0.3, 0, 1, 1] }}
                style={{
                  translateX: prefersReducedMotion ? 0 : translateX,
                  rotate: prefersReducedMotion ? 0 : rotate,
                  whiteSpace: 'nowrap',
                }}
                className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">{item.name}</div>
                <div className="text-xs text-white">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <Image
            onMouseMove={handleMouseMove}
            height={100}
            width={100}
            src={item.image}
            alt={item.name}
            className="relative !m-0 h-14 w-14 object-contain !p-0 transition duration-150 ease-out group-hover:z-30 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </button>
      ))}
    </>
  )
}
