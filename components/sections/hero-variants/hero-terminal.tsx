/**
 * Variant C — Terminal.
 * Headline left, an illustrative vibe-coding session right. Each tab is a
 * real showcase project; choosing a tab replays its session. The session
 * plays by itself only once per browser session.
 */
"use client";

import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HERO_EASE, HeroCtas, ProjectStats, useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

const SESSIONS = [
  { key: "poll", slug: "livepoll", file: "app/routes/poll.$id.tsx" },
  { key: "rab", slug: "estimato", file: "app/routes/rab.tsx" },
  { key: "money", slug: "spendly", file: "app/routes/dashboard.tsx" },
] as const;

type SessionKey = (typeof SESSIONS)[number]["key"];

const LINE_COUNT = 5;
const LINE_INTERVAL_MS = 320;

export function HeroTerminal({ projects, joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const { t } = useTranslation("heroVariants");
  const intro = useHeroIntro("terminal", forceIntro);
  const reduce = useReducedMotion();
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const sessions = SESSIONS.filter((session) => bySlug.has(session.slug));
  const [active, setActive] = useState<SessionKey>(sessions[0]?.key ?? "poll");
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(intro ? 0 : LINE_COUNT);

  useEffect(() => {
    if (reduce || (run === 0 && !intro)) {
      setShown(LINE_COUNT);
      return;
    }
    setShown(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setShown(count);
      if (count >= LINE_COUNT) window.clearInterval(timer);
    }, LINE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [run, intro, reduce]);

  const session = sessions.find((candidate) => candidate.key === active) ?? sessions[0];
  const project = session ? bySlug.get(session.slug) : undefined;

  const choose = (key: SessionKey) => {
    setActive(key);
    setRun((value) => value + 1);
  };

  const enter = (delay: number) =>
    intro
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: HERO_EASE },
        }
      : {};

  const lines = session
    ? [
        <>
          <span className="text-amber-300">$</span> vibe{" "}
          <span className="text-zinc-100">“{t(`terminal.sessions.${session.key}`)}”</span>
        </>,
        <>
          <span className="text-zinc-500">›</span>{" "}
          <span className="inline-block w-16 text-zinc-400">{t("terminal.steps.plan")}</span>
          {t("terminal.planDetail")}
        </>,
        <>
          <span className="text-zinc-500">›</span>{" "}
          <span className="inline-block w-16 text-zinc-400">{t("terminal.steps.build")}</span>
          {session.file}
        </>,
        <>
          <span className="text-zinc-500">›</span>{" "}
          <span className="inline-block w-16 text-zinc-400">{t("terminal.steps.ship")}</span>
          {t("terminal.shipDetail")}
        </>,
        <>
          <span className="text-emerald-400">✓</span> {project?.title} {t("terminal.done")}
        </>,
      ]
    : [];

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pt-28 pb-14 md:px-8 lg:min-h-[100svh] lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-0">
        <div className="lg:col-span-5">
          <motion.p {...enter(0)} className="mb-5 font-mono text-sm text-muted-foreground">
            {t("terminal.kicker")}
          </motion.p>
          <motion.h1
            {...enter(0.05)}
            className="text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-6xl"
          >
            {t("terminal.title")}
          </motion.h1>
          <motion.p
            {...enter(0.12)}
            className="mt-5 max-w-[46ch] text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
          >
            {t("terminal.subtitle")}
          </motion.p>
          <motion.div {...enter(0.18)}>
            <HeroCtas joinHref={joinHref} onViewShowcase={onViewShowcase} className="mt-8" />
          </motion.div>
        </div>

        <motion.div {...enter(0.2)} className="lg:col-span-7">
          <section
            aria-label={t("terminal.terminalLabel")}
            className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.6)]"
          >
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
              <div
                role="tablist"
                aria-label={t("terminal.terminalLabel")}
                className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]"
              >
                {sessions.map((candidate) => {
                  const item = bySlug.get(candidate.slug);
                  const selected = candidate.key === active;
                  return (
                    <button
                      key={candidate.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => choose(candidate.key)}
                      className={cn(
                        "min-h-11 shrink-0 rounded-md px-2.5 font-mono sm:min-h-8 text-xs transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none",
                        selected
                          ? "bg-zinc-800 text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-200",
                      )}
                    >
                      {item?.title.split(/[\s:–-]/)[0].toLowerCase()}
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto hidden shrink-0 rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-zinc-500 uppercase sm:inline">
                {t("terminal.illustration")}
              </span>
              <button
                type="button"
                onClick={() => setRun((value) => value + 1)}
                className="grid size-11 shrink-0 place-items-center rounded-md text-zinc-500 max-sm:ml-auto sm:size-8 transition-colors duration-150 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none"
              >
                <RotateCcw aria-hidden className="size-3.5" />
                <span className="sr-only">{t("terminal.replay")}</span>
              </button>
            </div>

            <p className="px-4 pt-3 font-mono text-[10px] tracking-wide text-zinc-500 uppercase sm:hidden">
              {t("terminal.illustration")}
            </p>
            <ol className="min-h-[13.5rem] space-y-2 px-4 py-4 font-mono text-[13px] leading-relaxed md:px-5 md:text-sm">
              {lines.map((line, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-order script lines.
                  key={index}
                  className={cn(
                    "transition-[opacity,translate] duration-200 ease-out",
                    index < shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                  )}
                >
                  {line}
                </li>
              ))}
            </ol>

            {project ? (
              <Link
                to="/project/$slug"
                params={{ slug: project.slug }}
                className={cn(
                  "flex items-center gap-3 border-t border-zinc-800 p-3 transition-[opacity,background-color] duration-300 ease-out hover:bg-zinc-900",
                  "focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none focus-visible:ring-inset",
                  shown >= LINE_COUNT ? "opacity-100" : "opacity-0",
                )}
              >
                <img
                  src={project.image}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-md object-cover object-top"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-100">
                    {project.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">{project.category}</span>
                </span>
                <ProjectStats project={project} className="shrink-0 text-xs text-zinc-400" />
              </Link>
            ) : null}
          </section>
        </motion.div>
      </div>
    </section>
  );
}
