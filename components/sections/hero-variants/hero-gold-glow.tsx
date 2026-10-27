import { useEffect, useState } from "react";
import { CalmBadge, CalmCtas, CalmMockup, CalmSubtitle, CalmTitle } from "./calm";
import { useHeroIntro } from "./shared";
import type { HeroVariantProps } from "./types";

const GRAIN_TILE_PX = 128;
let grainUrl: string | null = null;

/** 128px grey noise tile (128 ± 70), built once and reused. */
function getGrainUrl(): string | null {
  if (grainUrl || typeof document === "undefined") return grainUrl;
  const canvas = document.createElement("canvas");
  canvas.width = GRAIN_TILE_PX;
  canvas.height = GRAIN_TILE_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(GRAIN_TILE_PX, GRAIN_TILE_PX);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 128 + Math.round((Math.random() * 2 - 1) * 70);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  grainUrl = canvas.toDataURL("image/png");
  return grainUrl;
}

/**
 * Still, grainy gold light behind the headline: pale yellow at the top
 * warming to amber, fading into the page. Nothing moves.
 */
function GoldGlow() {
  const [grain, setGrain] = useState<string | null>(null);
  useEffect(() => setGrain(getGrainUrl()), []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] [mask-image:linear-gradient(to_bottom,black_35%,transparent)] sm:h-[46rem]"
    >
      <div className="absolute top-[-14rem] left-1/2 h-[34rem] w-[min(72rem,180vw)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,oklch(0.93_0.12_95/0.32),oklch(0.82_0.15_80/0.16)_50%,transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,oklch(0.9_0.17_95/0.30),oklch(0.72_0.16_70/0.14)_50%,transparent)]" />
      {grain && (
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay [mask-image:radial-gradient(ellipse_45%_60%_at_50%_0%,black,transparent)] dark:opacity-25"
          style={{ backgroundImage: `url(${grain})`, backgroundSize: `${GRAIN_TILE_PX}px` }}
        />
      )}
    </div>
  );
}

/**
 * H · Cahaya emas. The live hero over a soft grainy gold light instead of the
 * dot grid. Nothing else added.
 */
export function HeroGoldGlow({ joinHref, onViewShowcase, forceIntro }: HeroVariantProps) {
  const play = useHeroIntro("gold-glow", forceIntro);
  return (
    <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36">
      <GoldGlow />
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
      </div>
    </section>
  );
}
