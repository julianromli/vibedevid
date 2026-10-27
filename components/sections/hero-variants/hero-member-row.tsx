import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CalmBadge, CalmCtas, CalmSubtitle, CalmTitle, calmEnter } from "./calm";
import { useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

const ROW_SIZE = 5;

/**
 * G · Karya member. The live hero copy, then one still row of the newest real
 * member projects in place of the product mockup.
 */
export function HeroMemberRow({
  projects,
  joinHref,
  onViewShowcase,
  forceIntro,
}: HeroVariantProps) {
  const play = useHeroIntro("member-row", forceIntro);
  const { t } = useTranslation("heroVariants");
  const row = projects.slice(0, ROW_SIZE);

  return (
    <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28 sm:pb-28 lg:pt-36">
      <div
        aria-hidden
        className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black,transparent_75%)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6 text-center sm:space-y-7">
          <CalmBadge play={play} step={0} />
          <CalmTitle play={play} step={1} />
          <CalmSubtitle play={play} step={2} />
          <CalmCtas
            play={play}
            step={3}
            joinHref={joinHref}
            onViewShowcase={onViewShowcase}
            className="pt-3"
          />
        </div>

        <motion.div {...calmEnter(play, 5)} className="mx-auto mt-20 max-w-6xl sm:mt-28">
          <p className="text-muted-foreground mb-4 text-center text-sm">{t("calm.recent")}</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {row.map((project, index) => (
              <li key={project.id} className={cn(index === ROW_SIZE - 1 && "max-sm:hidden")}>
                <Link
                  to="/project/$slug"
                  params={{ slug: project.slug }}
                  className="group focus-visible:ring-ring/50 block rounded-lg outline-none focus-visible:ring-[3px]"
                >
                  <img
                    src={project.image}
                    alt=""
                    width={800}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="border-border bg-muted group-hover:border-foreground/25 aspect-[16/10] w-full rounded-lg border object-cover transition-colors duration-200 ease-out"
                  />
                  <span className="text-foreground/80 group-hover:text-foreground mt-2 line-clamp-1 text-left text-sm transition-colors duration-200">
                    {project.title}
                  </span>
                  <span className="text-muted-foreground block text-left text-xs">
                    {project.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
