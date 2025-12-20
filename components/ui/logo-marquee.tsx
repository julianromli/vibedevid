'use client'

import { Code2, Cpu, Terminal } from 'lucide-react'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { cn } from '@/lib/utils'

export type LogoItem = {
  name: string
  url?: string
  icon?: React.ElementType
}

const logos: LogoItem[] = [
  {
    name: 'Lovable',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/lovable-color.svg',
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
    icon: Terminal, // Fallback
  },
  {
    name: 'Warp',
    url: 'https://registry.npmmirror.com/@lobehub/icons-static-svg/latest/files/warp.svg',
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
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black,transparent)] py-12">
      <InfiniteSlider
        gap={40}
        speed={30}
        speedOnHover={10}
      >
        {logos.map((logo, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-4 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            {logo.url ? (
              <img
                src={logo.url}
                alt={logo.name}
                className="pointer-events-none h-8 w-auto object-contain select-none"
                loading="lazy"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : (
              <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                {logo.icon && <logo.icon className="h-5 w-5" />}
              </div>
            )}
            {/* Fallback text/icon container if image fails (hidden by default) */}
            <span className={cn('hidden text-lg font-semibold', !logo.url && 'hidden')}>{logo.name}</span>
            {/* Show name next to icon if it is an icon-only logo (optional, but good for obscure tools) */}
            {logo.url && <span className="ml-2 hidden text-sm font-medium">{logo.name}</span>}
          </div>
        ))}
      </InfiniteSlider>
    </div>
  )
}
