/**
 * Variant B — Prompt ke proyek.
 * A prompt box with example chips. Picking a chip types the prompt and
 * answers with a real showcase project that already does it. No network:
 * the composer only routes people to the community.
 */
"use client";

import { ArrowUp, CornerDownLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HERO_EASE, HeroCtas, ProjectCard, ProjectStats, useHeroIntro } from "./shared";
import type { HeroProject, HeroVariantProps } from "./types";

/** Example prompts, each answered by a real showcase project slug. */
export const PROMPT_EXAMPLES = [
  { key: "poll", slug: "livepoll" },
  { key: "rab", slug: "estimato" },
  { key: "receipt", slug: "koi-whatsapp-based-personal-finance-tracker" },
  { key: "quiz", slug: "agen-soal" },
] as const;

type ExampleKey = (typeof PROMPT_EXAMPLES)[number]["key"];

const TYPE_MS_PER_CHAR = 12;

export function HeroPrompt({ projects, joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const { t } = useTranslation("heroVariants");
  const intro = useHeroIntro("prompt", forceIntro);
  const reduce = useReducedMotion();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [active, setActive] = useState<ExampleKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const typing = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(typing.current), []);

  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const examples = PROMPT_EXAMPLES.filter((example) => bySlug.has(example.slug));
  const match: HeroProject | undefined = active
    ? bySlug.get(PROMPT_EXAMPLES.find((example) => example.key === active)?.slug ?? "")
    : undefined;
  const community = projects.filter((project) => project.slug !== match?.slug).slice(0, 4);

  const pick = (key: ExampleKey) => {
    window.clearInterval(typing.current);
    const text = t(`prompt.examples.${key}`);
    setActive(key);
    setSubmitted(false);
    if (reduce) {
      setValue(text);
      return;
    }
    let length = 0;
    typing.current = window.setInterval(() => {
      length += 2;
      setValue(text.slice(0, length));
      if (length >= text.length) window.clearInterval(typing.current);
    }, TYPE_MS_PER_CHAR * 2);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) setSubmitted(true);
  };

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
      <div className="mx-auto max-w-6xl px-5 pt-28 pb-14 md:px-8 lg:pt-36">
        <motion.h1
          {...enter(0)}
          className="max-w-[16ch] text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance md:text-6xl"
        >
          {t("prompt.title")}
        </motion.h1>
        <motion.p
          {...enter(0.06)}
          className="mt-4 max-w-[52ch] text-base leading-relaxed text-pretty text-muted-foreground md:text-lg"
        >
          {t("prompt.subtitle")}
        </motion.p>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          <motion.form {...enter(0.12)} onSubmit={onSubmit} className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-[0_1px_0_0_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.25)] focus-within:border-foreground/30">
              <label htmlFor={inputId} className="sr-only">
                {t("prompt.inputLabel")}
              </label>
              <textarea
                id={inputId}
                rows={3}
                value={value}
                onChange={(event) => {
                  window.clearInterval(typing.current);
                  setValue(event.target.value);
                  setActive(null);
                  setSubmitted(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) onSubmit(event);
                }}
                placeholder={t("prompt.inputPlaceholder")}
                className="block w-full resize-none bg-transparent px-3 pt-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground md:text-lg"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1">
                <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                  <CornerDownLeft aria-hidden className="size-3.5" /> Enter
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="ml-auto rounded-full"
                  disabled={!value.trim()}
                >
                  <ArrowUp aria-hidden />
                  <span className="sr-only">{t("prompt.submit")}</span>
                </Button>
              </div>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs text-muted-foreground">
                {t("prompt.examplesLabel")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example.key}
                    type="button"
                    aria-pressed={active === example.key}
                    onClick={() => pick(example.key)}
                    className={cn(
                      "min-h-11 rounded-full border px-3.5 sm:min-h-9 text-sm transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.97]",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active === example.key
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground/40",
                    )}
                  >
                    {t(`prompt.examples.${example.key}`)}
                  </button>
                ))}
              </div>
            </fieldset>
          </motion.form>

          <motion.div {...enter(0.18)} className="lg:col-span-5" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {match ? (
                <motion.div
                  key={match.slug}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.28, ease: HERO_EASE }}
                >
                  <p className="mb-2 text-xs text-muted-foreground">{t("prompt.resultLabel")}</p>
                  <ProjectCard project={match} eager />
                </motion.div>
              ) : submitted ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-dashed border-border p-5"
                >
                  <p className="text-sm text-pretty">{t("prompt.emptyResult")}</p>
                  <HeroCtas joinHref={joinHref} onViewShowcase={onViewShowcase} className="mt-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:rounded-xl lg:border lg:border-dashed lg:border-border lg:p-5"
                >
                  <p className="hidden text-sm text-pretty text-muted-foreground lg:block">
                    {t("prompt.idleHint")}
                  </p>
                  <HeroCtas
                    joinHref={joinHref}
                    onViewShowcase={onViewShowcase}
                    className="lg:mt-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div {...enter(0.24)} className="mt-14 hidden md:block">
          <p className="mb-3 text-sm font-medium">{t("prompt.communityLabel")}</p>
          <ul className="grid grid-cols-4 gap-4">
            {community.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </motion.div>
        <ul className="mt-10 space-y-2 md:hidden" aria-label={t("prompt.communityLabel")}>
          {community.slice(0, 3).map((project) => (
            <li
              key={project.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2"
            >
              <img
                src={project.image}
                alt=""
                className="h-10 w-16 rounded object-cover object-top"
              />
              <span className="min-w-0 flex-1 truncate text-sm">{project.title}</span>
              <ProjectStats project={project} className="text-xs text-muted-foreground" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
