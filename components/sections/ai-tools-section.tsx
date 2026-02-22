/**
 * AI Tools Section Component
 * Displays grid of AI coding tools and integrations
 */

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { IntegrationCard } from '@/components/ui/integration-card'

export function AIToolsSection() {
  const t = useTranslations('aiTools')
  const buttonLabel = t('learnMore')

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
            title="Claude Code"
            description={t('tools.claudeCode.description')}
            buttonLabel={buttonLabel}
            link="https://code.claude.com/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude.svg"
                alt="Claude Code"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="OpenCode"
            description={t('tools.opencode.description')}
            buttonLabel={buttonLabel}
            link="https://opencode.ai/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNmd7UKUS3qiwQIZJ918ETlWxte5zyo0VpXdFf"
                alt="OpenCode"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Droid"
            description={t('tools.droid.description')}
            buttonLabel={buttonLabel}
            link="https://factory.ai/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://avatars.githubusercontent.com/u/131064358?s=200&v=4"
                alt="Droid"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Antigravity"
            description={t('tools.antigravity.description')}
            buttonLabel={buttonLabel}
            link="https://antigravity.google/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg"
                alt="Antigravity"
                width={32}
                height={32}
              />
            </div>
          </IntegrationCard>

          <IntegrationCard
            title="Cursor"
            description={t('tools.cursor.description')}
            buttonLabel={buttonLabel}
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
            title="Kiro"
            description={t('tools.kiro.description')}
            buttonLabel={buttonLabel}
            link="https://kiro.dev/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <Image
                className="h-8 w-8"
                src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kiro.svg"
                alt="Kiro"
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
