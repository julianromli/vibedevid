/**
 * AI Tools Section Component
 * Displays grid of AI coding tools and integrations
 */

import Image from 'next/image'
import { IntegrationCard } from '@/components/ui/integration-card'

export function AIToolsSection() {
  return (
    <section id="integrations" className="py-20" data-animate>
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            AI untuk Coding & Development Tools
          </h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-xl">
            Explore tools AI terbaru untuk coding pake AI yang lebih efisien.
            Integrasikan AI coding agents favorit untuk workflow development
            yang next-level.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            title="Lovable"
            description="AI co-engineer yang build full-stack apps dari single prompt. Integrates dengan auth, payments, dan databases otomatis."
            link="https://lovable.dev/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/lovable.svg"
                alt="Lovable"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="v0.app"
            description="AI-powered design-to-code platform yang convert ideas jadi functional apps. Rapid prototyping dengan visual interface builder."
            link="https://v0.app/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/v0.svg"
                alt="v0"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="OpenAI Codex"
            description="AI programming assistant yang bisa generate, explain, dan debug code. Supports multiple languages dengan natural language interface."
            link="https://github.com/openai/codex"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg"
                alt="OpenAI Codex"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Cursor"
            description="AI-powered code editor yang understand codebase lo. Natural language to code dengan intelligent completion dan real-time suggestions."
            link="https://cursor.com/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/cursor.svg"
                alt="Cursor"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Warp"
            description="Modern terminal dengan Active AI features, command suggestions, dan intelligent autocompletion untuk workflow yang lebih efficient."
            link="https://warp.dev/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="/warpdev.jpg"
                alt="Warp"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Trae"
            description="AI-powered development framework yang accelerate project creation dengan intelligent code generation dan automation tools."
            link="https://trae.ai/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/trae.svg"
                alt="Trae"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>
        </div>
      </div>
    </section>
  )
}
