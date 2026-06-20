"use client";

/**
 * AI Tools Section Component
 * Displays grid of AI coding tools and integrations
 */

import { Image } from "@unpic/react";
import { useTranslation } from "react-i18next";
import { IntegrationCard } from "@/components/ui/integration-card";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

export function AIToolsSection() {
  const { t } = useTranslation("aiTools");
  const buttonLabel = t("learnMore");

  return (
    <section id="integrations" className="py-20" data-animate>
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-xl">{t("description")}</p>
        </ScrollReveal>

        <StaggerContainer className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StaggerItem>
            <IntegrationCard
              title="Claude Code"
              description={t("tools.claudeCode.description")}
              buttonLabel={buttonLabel}
              link="https://code.claude.com/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/claude.svg"
                  alt="Claude Code"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>

          <StaggerItem>
            <IntegrationCard
              title="OpenCode"
              description={t("tools.opencode.description")}
              buttonLabel={buttonLabel}
              link="https://opencode.ai/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNmd7UKUS3qiwQIZJ918ETlWxte5zyo0VpXdFf"
                  alt="OpenCode"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>

          <StaggerItem>
            <IntegrationCard
              title="Droid"
              description={t("tools.droid.description")}
              buttonLabel={buttonLabel}
              link="https://factory.ai/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://avatars.githubusercontent.com/u/131064358?s=200&v=4"
                  alt="Droid"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>

          <StaggerItem>
            <IntegrationCard
              title="Antigravity"
              description={t("tools.antigravity.description")}
              buttonLabel={buttonLabel}
              link="https://antigravity.google/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg"
                  alt="Antigravity"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>

          <StaggerItem>
            <IntegrationCard
              title="Cursor"
              description={t("tools.cursor.description")}
              buttonLabel={buttonLabel}
              link="https://cursor.com/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/cursor.svg"
                  alt="Cursor"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>

          <StaggerItem>
            <IntegrationCard
              title="Kiro"
              description={t("tools.kiro.description")}
              buttonLabel={buttonLabel}
              link="https://kiro.dev/"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Image
                  className="h-8 w-8"
                  loading="lazy"
                  src="https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kiro.svg"
                  alt="Kiro"
                  width={32}
                  height={32}
                />
              </div>
            </IntegrationCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}
