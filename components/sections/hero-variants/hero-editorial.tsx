/**
 * Variant D — Editorial.
 * One loud type choice: Instrument Serif at display size over a ghost
 * wordmark. Proof sits in a grainy gold field as plain, sourced facts.
 */
"use client";

import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { GrainyField } from "./grainy-field";
import { HERO_EASE, HeroCtas, useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

export function HeroEditorial({ joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const { t } = useTranslation("heroVariants");
  const intro = useHeroIntro("editorial", forceIntro);

  const enter = (delay: number, blur = false) =>
    intro
      ? {
          initial: { opacity: 0, y: 14, ...(blur ? { filter: "blur(6px)" } : {}) },
          animate: { opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) },
          transition: { duration: 0.6, delay, ease: HERO_EASE },
        }
      : {};

  const stats = [
    { value: "1500+", label: t("editorial.statMembers") },
    { value: t("editorial.statSessionsValue"), label: t("editorial.statSessions") },
    { value: t("editorial.statOpenSourceValue"), label: t("editorial.statOpenSource") },
  ];

  return (
    <section className="relative overflow-hidden bg-background">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[0.08em] left-1/2 -translate-x-1/2 font-serif text-[34vw] leading-none tracking-[-0.04em] whitespace-nowrap text-foreground/[0.045] select-none"
      >
        vibedev
      </span>
      <div className="relative mx-auto max-w-7xl px-5 pt-28 pb-10 md:px-8 lg:pt-40">
        <h1 className="font-serif text-[3.6rem] leading-[0.92] tracking-[-0.02em] md:text-[7.5rem]">
          <motion.span {...enter(0, true)} className="block">
            {t("editorial.titleLead")}
          </motion.span>
          <motion.span
            {...enter(0.1, true)}
            className="block italic text-primary dark:text-primary"
          >
            {t("editorial.titleAccent")}
          </motion.span>
        </h1>
        <div className="mt-8 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between">
          <motion.p
            {...enter(0.2)}
            className="max-w-[44ch] text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            {t("editorial.subtitle")}
          </motion.p>
          <motion.div {...enter(0.26)}>
            <HeroCtas joinHref={joinHref} onViewShowcase={onViewShowcase} />
          </motion.div>
        </div>

        <motion.div {...enter(0.34)}>
          <GrainyField className="mt-10 rounded-3xl md:mt-14">
            <dl className="grid min-h-[15rem] grid-cols-1 content-end gap-5 p-6 text-white sm:grid-cols-3 md:min-h-[19rem] md:p-8">
              {stats.map((stat) => (
                <div key={stat.label} className="border-t border-white/30 pt-3">
                  <dt className="text-sm text-white/75">{stat.label}</dt>
                  <dd className="mt-1 font-serif text-4xl leading-none md:text-5xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </GrainyField>
        </motion.div>
      </div>
    </section>
  );
}
