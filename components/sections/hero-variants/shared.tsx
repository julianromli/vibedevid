import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Heart } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HeroProject } from "./types";

/** Shared easing for hero entrances: fast out, soft landing. */
export const HERO_EASE = [0.2, 0, 0, 1] as const;

const INTRO_KEY_PREFIX = "vibedevid.hero-intro.";

/**
 * Entrance animations play once per browser session. Returning visitors land
 * on the settled hero; reduced-motion users never see the entrance.
 */
export function useHeroIntro(id: string, force = false): boolean {
  const reduce = useReducedMotion();
  const [play] = useState(() => {
    if (typeof window === "undefined") return false;
    if (force) return true;
    try {
      const key = INTRO_KEY_PREFIX + id;
      if (window.sessionStorage.getItem(key)) return false;
      window.sessionStorage.setItem(key, "1");
      return true;
    } catch {
      return false;
    }
  });
  return play && !reduce;
}

const compact = new Intl.NumberFormat("id-ID", { notation: "compact" });

export function formatCount(value: number): string {
  return compact.format(value);
}

export function HeroCtas({
  joinHref,
  onViewShowcase,
  className,
}: {
  joinHref: string;
  onViewShowcase: () => void;
  className?: string;
}) {
  const { t } = useTranslation("heroVariants");
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button asChild size="lg" className="group h-11 px-5 text-[15px]">
        <a href={joinHref} target="_blank" rel="noopener noreferrer">
          {t("common.join")}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </a>
      </Button>
      <Button variant="ghost" size="lg" className="h-11 px-4 text-[15px]" onClick={onViewShowcase}>
        {t("common.showcase")}
      </Button>
    </div>
  );
}

/** Views and likes exactly as the showcase stores them. */
export function ProjectStats({ project, className }: { project: HeroProject; className?: string }) {
  const { t } = useTranslation("heroVariants");
  return (
    <span className={cn("inline-flex items-center gap-3 tabular-nums", className)}>
      <span className="inline-flex items-center gap-1">
        <Eye aria-hidden className="size-3.5" />
        {formatCount(project.views)}
        <span className="sr-only">{t("common.views")}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart aria-hidden className="size-3.5" />
        {formatCount(project.likes)}
        <span className="sr-only">{t("common.likes")}</span>
      </span>
    </span>
  );
}

/** Thumbnail card that links to the project page. */
export function ProjectCard({
  project,
  className,
  imageClassName,
  eager,
}: {
  project: HeroProject;
  className?: string;
  imageClassName?: string;
  eager?: boolean;
}) {
  return (
    <Link
      to="/project/$slug"
      params={{ slug: project.slug }}
      className={cn(
        "group/card block overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        "transition-[border-color,translate] duration-200 ease-out hover:border-foreground/25",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <div className={cn("aspect-[16/10] overflow-hidden bg-muted", imageClassName)}>
        <img
          src={project.image}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover object-top"
        />
      </div>
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{project.title}</p>
          <p className="truncate text-xs text-muted-foreground">{project.category}</p>
        </div>
        <ProjectStats project={project} className="shrink-0 pt-0.5 text-xs text-muted-foreground" />
      </div>
    </Link>
  );
}
