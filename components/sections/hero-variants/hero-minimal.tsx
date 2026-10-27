import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { CalmCtas, CalmSubtitle, CalmTitle, calmEnter } from "./calm";
import { useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

/**
 * I · Minimal. Only the headline, subtitle and one primary button, centred in
 * a lot of space. A quiet line under it carries the live member count
 * and the showcase link.
 */
export function HeroMinimal({ joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const play = useHeroIntro("minimal", forceIntro);
  const { t } = useTranslation("hero");

  return (
    <section className="relative flex min-h-[min(54rem,calc(100svh-4rem))] items-center overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden
        className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,black,transparent_80%)]"
      />
      <div className="relative mx-auto w-full max-w-4xl space-y-6 px-4 text-center sm:space-y-7 sm:px-6 lg:px-8">
        <CalmTitle play={play} step={0} />
        <CalmSubtitle play={play} step={1} />
        <CalmCtas
          play={play}
          step={2}
          joinHref={joinHref}
          onViewShowcase={onViewShowcase}
          showSecondary={false}
          className="pt-3"
        />
        <motion.div
          {...calmEnter(play, 4)}
          className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-6 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="bg-primary size-1.5 rounded-full" />
            {t("announcement")}
          </span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <button
            type="button"
            onClick={onViewShowcase}
            className="hover:text-foreground focus-visible:ring-ring/50 group inline-flex min-h-11 items-center gap-1 rounded-md font-medium underline-offset-4 transition-colors duration-200 ease-out outline-none hover:underline focus-visible:ring-[3px]"
          >
            {t("ourShowcase")}
            <ArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
