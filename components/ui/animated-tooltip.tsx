'use client'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const AnimatedTooltip = ({
  items,
  className,
}: {
  items: {
    id: number
    name: string
    designation: string
    image: string
  }[]
  className?: string
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div
      className={cn(
        'mb-4 hidden items-center justify-center gap-7 md:mb-0 md:flex',
        className,
      )}
    >
      {items.map((item) => (
        <div
          className="group relative"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {hoveredIndex === item.id && (
            <div className="bg-foreground pointer-events-none absolute -top-16 left-1/2 z-[100] flex -translate-x-1/2 transform flex-col items-center justify-center rounded-md px-4 py-2 text-xs opacity-100 shadow-xl transition-all duration-200">
              <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
              <div className="text-background relative z-30 text-base font-bold whitespace-nowrap">
                {item.name}
              </div>
              <div className="text-muted-foreground text-xs whitespace-nowrap">
                {item.designation}
              </div>
            </div>
          )}
          <Image
            height={32}
            width={32}
            src={item.image || '/placeholder.svg'}
            alt={item.name}
            className="relative !m-0 h-8 w-8 cursor-pointer object-contain !p-0 transition duration-300 group-hover:z-30 hover:grayscale-0"
          />
        </div>
      ))}
    </div>
  )
}

export default AnimatedTooltip
