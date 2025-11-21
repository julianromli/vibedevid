'use client'

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { cn } from '@/lib/utils'
import { Terminal, Code2, Cpu } from 'lucide-react'

export type LogoItem = {
  name: string
  url?: string
  icon?: React.ElementType
}

const logos: LogoItem[] = [
  {
    name: 'Lovable',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/lovable.svg',
  },
  {
    name: 'Google AI Studio',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/aistudio.svg',
  },
  {
    name: 'V0',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/v0.svg',
  },
  {
    name: 'Droid CLI',
    icon: Terminal, // Fallback using Lucide icon
  },
  {
    name: 'Warp',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/warp.svg', // Trying standard path first, fallback to generic if fails
  },
  {
    name: 'Claude',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/claude-color.svg',
  },
  {
    name: 'Cursor',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/cursor.svg',
  },
  {
    name: 'Windsurf',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/windsurf.svg',
  },
  {
    name: 'Kilocode',
    icon: Code2, // Fallback
  },
  {
    name: 'Kiro',
    icon: Cpu, // Fallback
  },
  {
    name: 'Trae',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/trae-color.svg',
  },
]

export function LogoMarquee() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent z-10"></div>
        
        <InfiniteSlider gap={40} duration={30} durationOnHover={100}>
        {logos.map((logo, idx) => (
            <div
            key={idx}
            className="flex items-center gap-2 grayscale transition-all duration-300 hover:grayscale-0 opacity-70 hover:opacity-100 px-4"
            >
            {logo.url ? (
                <img
                src={logo.url}
                alt={logo.name}
                className="h-8 w-auto object-contain"
                loading="lazy"
                onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {logo.icon && <logo.icon className="h-5 w-5" />}
                </div>
            )}
            {/* Fallback text/icon container if image fails (hidden by default) */}
            <span className={cn("text-lg font-semibold hidden", !logo.url && "block ml-2")}>
                {logo.name}
            </span>
             {/* Show name next to icon if it is an icon-only logo (optional, but good for obscure tools) */}
             {logo.url && (
                 <span className="text-sm font-medium ml-2 hidden md:block">{logo.name}</span>
             )}
            </div>
        ))}
        </InfiniteSlider>
    </div>
  )
}
