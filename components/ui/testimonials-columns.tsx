'use client'
import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import type { Testimonial } from '@/types/homepage'

export const TestimonialsColumns = (props: { className?: string; testimonials: Testimonial[]; duration?: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const duration = props.duration || 10
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      element.style.animation = 'none'
    } else {
      element.style.animation = `scroll-up ${duration}s linear infinite`
    }
  }, [props.duration])

  return (
    <div className={props.className}>
      <div
        ref={scrollRef}
        className="animate-scroll-up flex flex-col gap-6 bg-transparent pb-6"
        style={{
          animationDuration: `${props.duration || 10}s`,
        }}
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index === 0 ? 'original' : 'duplicate'}>
              {props.testimonials.map(({ text, image, name, role }) => (
                <div
                  className="shadow-primary/5 bg-background w-full max-w-xs rounded-2xl border p-8 shadow-lg"
                  key={name + role}
                  aria-hidden={index === 1 ? 'true' : undefined}
                >
                  <div className="text-muted-foreground mb-4 text-sm leading-relaxed">{text}</div>
                  <div className="flex items-center gap-3">
                    {image ? (
                      <Image
                        width={40}
                        height={40}
                        src={image}
                        alt={name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold">
                        {name.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="text-sm leading-5 font-semibold tracking-tight">{name}</div>
                      <div className="text-muted-foreground text-xs leading-5 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </div>
    </div>
  )
}
