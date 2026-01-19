/**
 * AI Tools Section Component
 * Displays grid of AI coding tools and integrations
 */

import Image from 'next/image'
import { IntegrationCard } from '@/components/ui/integration-card'
import { useSafeTranslations } from '@/hooks/useSafeTranslations'

export function AIToolsSection() {
  const t = useSafeTranslations('aiTools')

  return (
    <section
      id="integrations"
      className="py-20"
      data-animate
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-xl">{t('description')}</p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            title="Lovable"
            description={t('tools.lovable.description')}
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
            description={t('tools.v0.description')}
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
            description={t('tools.openai.description')}
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
            description={t('tools.cursor.description')}
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
            description={t('tools.warp.description')}
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
            description={t('tools.trae.description')}
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
