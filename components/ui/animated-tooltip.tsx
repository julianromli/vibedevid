"use client"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

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
    <div className={cn("hidden md:flex items-center justify-center gap-7 mb-4 md:mb-0", className)}>
      {items.map((item) => (
        <div
          className="relative group"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {hoveredIndex === item.id && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-foreground z-[100] shadow-xl px-4 py-2 transition-all duration-200 opacity-100 pointer-events-none">
              <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-px" />
              <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />
              <div className="font-bold text-background relative z-30 text-base whitespace-nowrap">{item.name}</div>
              <div className="text-muted-foreground text-xs whitespace-nowrap">{item.designation}</div>
            </div>
          )}
          <Image
            height={32}
            width={32}
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="object-contain !m-0 !p-0 h-8 w-8 group-hover:scale-110 group-hover:z-30 relative transition duration-300 hover:grayscale-0 cursor-pointer"
          />
        </div>
      ))}
    </div>
  )
}

export default AnimatedTooltip
