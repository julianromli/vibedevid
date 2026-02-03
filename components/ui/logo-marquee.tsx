'use client'

import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { cn } from '@/lib/utils'

export type LogoItem = {
  name: string
  url?: string
  icon?: React.ElementType
}

const logos: LogoItem[] = [
  // AI LLMs
  {
    name: 'Claude',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude-color.svg',
  },
  {
    name: 'Gemini',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/gemini-color.svg',
  },
  {
    name: 'ChatGPT',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg',
  },
  {
    name: 'Anthropic',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/anthropic.svg',
  },
  {
    name: 'ChatGLM',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/chatglm-color.svg',
  },
  {
    name: 'Kimi',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kimi-color.svg',
  },
  {
    name: 'Minimax',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/minimax-color.svg',
  },
  {
    name: 'Zhipu',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/zhipu-color.svg',
  },

  // Coding Tools
  {
    name: 'Cursor',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/cursor.svg',
  },
  {
    name: 'Windsurf',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/windsurf.svg',
  },
  {
    name: 'GitHub Copilot',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/copilot-color.svg',
  },
  {
    name: 'Replit',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/replit-color.svg',
  },
  {
    name: 'Trae',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/trae-color.svg',
  },
  {
    name: 'Grok',
    url: 'https://unpkg.com/@lobehub/icons-static-svg@latest/icons/grok.svg',
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
            className="flex items-center gap-2 px-4 transition-all duration-300"
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
