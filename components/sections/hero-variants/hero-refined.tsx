import { Suspense } from "react";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { CalmBadge, CalmCtas, CalmMockup, CalmSubtitle, CalmTitle } from "./calm";
import { useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

/**
 * F · Rapi. The live hero with tighter type, a narrower subtitle, a clear
 * primary/secondary CTA pair, more air, and a fainter dot grid.
 */
export function HeroRefined({ joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const play = useHeroIntro("refined", forceIntro);
  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36">
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
        <CalmMockup play={play} step={5} className="mt-16 sm:mt-24" />
        <div className="mt-14 opacity-80 sm:mt-20">
          <Suspense fallback={<div className="h-12" />}>
            <LogoMarquee />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
