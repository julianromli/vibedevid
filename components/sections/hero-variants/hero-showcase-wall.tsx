/**
 * Variant A — Etalase.
 * The product is the proof: real showcase projects fill the right half.
 * The wall only moves when the pointer moves over it (parallax per column).
 */
"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { HERO_EASE, HeroCtas, ProjectCard, useHeroIntro } from "./shared";
import type { HeroProject, HeroVariantProps } from "./types";

const COLUMN_OFFSETS = [40, -56, 96];
const PARALLAX = [-28, 36, -20];

function splitColumns(projects: HeroProject[], count: number): HeroProject[][] {
  const columns: HeroProject[][] = Array.from({ length: count }, () => []);
  projects.forEach((project, index) => {
    columns[index % count].push(project);
  });
  return columns;
}

export function HeroShowcaseWall({
  projects,
  joinHref,
  onViewShowcase,
  forceIntro,
}: HeroVariantProps) {
  const { t } = useTranslation("heroVariants");
  const intro = useHeroIntro("wall", forceIntro);
  const reduce = useReducedMotion();
  const pointerY = useMotionValue(0);
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 24, mass: 0.6 });
  const shift0 = useTransform(smoothY, (v) => v * PARALLAX[0]);
  const shift1 = useTransform(smoothY, (v) => v * PARALLAX[1]);
  const shift2 = useTransform(smoothY, (v) => v * PARALLAX[2]);
  const shifts = [shift0, shift1, shift2];
  const columns = splitColumns(projects.slice(0, 9), 3);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const enter = (delay: number) =>
    intro
      ? {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: HERO_EASE },
        }
      : {};

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pt-28 pb-12 md:px-8 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-0">
        <div className="lg:col-span-5 lg:pt-16">
          <motion.p {...enter(0)} className="mb-5 text-sm text-muted-foreground">
            {t("wall.kicker")}
            <span aria-hidden className="mx-2 text-border">
              /
            </span>
            <span className="tabular-nums">{t("wall.count", { count: projects.length })}</span>
          </motion.p>
          <motion.h1
            {...enter(0.05)}
            className="text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-6xl"
          >
            {t("wall.title")}
          </motion.h1>
          <motion.p
            {...enter(0.12)}
            className="mt-5 max-w-[46ch] text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            {t("wall.subtitle")}
          </motion.p>
          <motion.div {...enter(0.18)}>
            <HeroCtas joinHref={joinHref} onViewShowcase={onViewShowcase} className="mt-8" />
          </motion.div>
        </div>

        {/* Desktop wall: three offset columns, pointer-driven parallax. */}
        <section
          aria-label={t("wall.railLabel")}
          onPointerMove={onPointerMove}
          onPointerLeave={() => pointerY.set(0)}
          className="relative hidden h-[min(820px,100svh)] overflow-hidden lg:col-span-7 lg:block"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
          }}
        >
          <div className="grid h-full grid-cols-3 gap-4 pt-10">
            {columns.map((column, index) => (
              <motion.div
                key={column[0]?.id ?? index}
                initial={intro ? { opacity: 0, y: 40 } : false}
                animate={intro ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.6, delay: 0.15 + index * 0.08, ease: HERO_EASE }}
                style={{ marginTop: COLUMN_OFFSETS[index] }}
              >
                <motion.div style={{ y: shifts[index] }} className="flex flex-col gap-4">
                  {column.map((project) => (
                    <ProjectCard key={project.id} project={project} eager />
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mobile: a swipeable rail. Nothing moves unless the user swipes. */}
        <div className="-mx-5 lg:hidden">
          <p className="sr-only">{t("wall.swipeHint")}</p>
          <ul
            aria-label={t("wall.railLabel")}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none]"
          >
            {projects.slice(0, 8).map((project) => (
              <li key={project.id} className="w-[78%] shrink-0 snap-start sm:w-[44%]">
                <ProjectCard project={project} eager />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
