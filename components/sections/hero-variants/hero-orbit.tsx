/**
 * Variant E — Orbit.
 * The community as a system: the V mark at the center, real showcase
 * projects on two rings. Rings only turn with the pointer, never on a timer.
 */
"use client";

import { Link } from "@tanstack/react-router";
import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HERO_EASE, HeroCtas, useHeroIntro } from "./shared";
import type { HeroProject, HeroVariantProps } from "./types";

const RINGS = [
  { radius: 30, count: 4, offset: 20, turn: 10, size: "size-[16%]" },
  { radius: 46, count: 6, offset: 0, turn: -7, size: "size-[13%]" },
];

function Ring({
  projects,
  radius,
  offset,
  rotate,
  size,
  intro,
  delay,
}: {
  projects: HeroProject[];
  radius: number;
  offset: number;
  rotate: MotionValue<number>;
  size: string;
  intro: boolean;
  delay: number;
}) {
  const counter = useTransform(rotate, (value) => -value);
  return (
    <motion.div className="absolute inset-0" style={{ rotate }}>
      <div
        aria-hidden
        className="absolute rounded-full border border-dashed border-border"
        style={{ inset: `${50 - radius}%` }}
      />
      {projects.map((project, index) => {
        const angle = ((offset + (360 / projects.length) * index) * Math.PI) / 180;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        return (
          <motion.div
            key={project.id}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2", size)}
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={intro ? { opacity: 0, scale: 0.6 } : false}
            animate={intro ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.5, delay: delay + index * 0.05, ease: HERO_EASE }}
          >
            <motion.div style={{ rotate: counter }} className="size-full">
              <Link
                to="/project/$slug"
                params={{ slug: project.slug }}
                className={cn(
                  "group/tile relative block size-full rounded-2xl border border-border bg-card p-1 shadow-sm",
                  "transition-[scale,border-color] duration-200 ease-out hover:scale-110 hover:border-foreground/30",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                <img
                  src={project.image}
                  alt=""
                  className="size-full rounded-xl object-cover object-top"
                />
                <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100">
                  {project.title.split(" - ")[0]}
                </span>
                <span className="sr-only">{project.title}</span>
              </Link>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function HeroOrbit({ projects, joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const { t } = useTranslation("heroVariants");
  const intro = useHeroIntro("orbit", forceIntro);
  const reduce = useReducedMotion();
  const pointer = useMotionValue(0);
  const smooth = useSpring(pointer, { stiffness: 70, damping: 14, mass: 1 });
  const inner = useTransform(smooth, (value) => value * RINGS[0].turn);
  const outer = useTransform(smooth, (value) => value * RINGS[1].turn);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width - 0.5) * 2);
  };

  const innerProjects = projects.slice(0, RINGS[0].count);
  const outerProjects = projects.slice(RINGS[0].count, RINGS[0].count + RINGS[1].count);

  const enter = (delay: number) =>
    intro
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: HERO_EASE },
        }
      : {};

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 pt-24 pb-14 md:px-8 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-0">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <motion.p {...enter(0)} className="mb-5 text-sm text-muted-foreground">
            {t("orbit.kicker")}
          </motion.p>
          <motion.h1
            {...enter(0.05)}
            className="text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-6xl"
          >
            {t("orbit.title")}
          </motion.h1>
          <motion.p
            {...enter(0.12)}
            className="mt-5 max-w-[44ch] text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            {t("orbit.subtitle")}
          </motion.p>
          <motion.div {...enter(0.18)}>
            <HeroCtas joinHref={joinHref} onViewShowcase={onViewShowcase} className="mt-8" />
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7">
          <section
            aria-label={t("orbit.orbitLabel")}
            onPointerMove={onPointerMove}
            onPointerLeave={() => pointer.set(0)}
            className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-[40rem]"
          >
            <Ring
              projects={outerProjects}
              radius={RINGS[1].radius}
              offset={RINGS[1].offset}
              rotate={outer}
              size={RINGS[1].size}
              intro={intro}
              delay={0.25}
            />
            <Ring
              projects={innerProjects}
              radius={RINGS[0].radius}
              offset={RINGS[0].offset}
              rotate={inner}
              size={RINGS[0].size}
              intro={intro}
              delay={0.1}
            />
            <div className="absolute top-1/2 left-1/2 grid size-[18%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28%] bg-foreground shadow-lg">
              <img src="/V_vibedevid_white.svg" alt="" className="w-1/2 dark:hidden" />
              <img src="/V_vibedevid_black.svg" alt="" className="hidden w-1/2 dark:block" />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
