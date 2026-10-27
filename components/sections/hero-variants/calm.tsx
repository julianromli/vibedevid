import { ArrowRight } from "lucide-react";
import { type HTMLMotionProps, motion } from "motion/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SafariMockup } from "@/components/ui/safari-mockup";
import { useLocale } from "@/hooks/use-locale";
import { JOIN_COMMUNITY_URL } from "@/lib/seo/site-url";
import { cn } from "@/lib/utils";

/**
 * Round 2 building blocks. Same copy (`hero` namespace), tokens and type as the
 * live hero; only spacing, hierarchy and motion are quieter.
 */

/** Strong ease-out: quick start, long soft landing. */
export const CALM_EASE = [0.23, 1, 0.32, 1] as const;
const CALM_DURATION_S = 0.32;
const CALM_STAGGER_S = 0.06;

type Enter = Pick<HTMLMotionProps<"div">, "initial" | "animate" | "transition">;

/**
 * Block-level entrance: fade, 8px rise and a light blur, one block at a time.
 * When `play` is false (intro already seen, or reduced motion) nothing moves.
 */
export function calmEnter(play: boolean, step: number): Enter {
  if (!play) return { initial: false };
  return {
    initial: { opacity: 0, y: 8, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: CALM_DURATION_S, delay: step * CALM_STAGGER_S, ease: CALM_EASE },
  };
}

function splitWords(text: string, at: number): [string, string] {
  const words = text.split(" ");
  return [words.slice(0, at).join(" "), words.slice(at).join(" ")];
}

/**
 * The live headline, word for word. Indonesian keeps the live mobile layout:
 * "Komunitas" / "Vibe Coding No. 1" / "di Indonesia".
 */
export function CalmTitle({
  play,
  step = 0,
  className,
}: {
  play: boolean;
  step?: number;
  className?: string;
}) {
  const { t } = useTranslation("hero");
  const locale = useLocale();
  const line1 = t("titleLine1");
  const line2 = t("titleLine2");

  let content: ReactNode;
  if (locale === "id") {
    const [a1, b1] = splitWords(line1, 1);
    const [a2, b2] = splitWords(line2, 2);
    content = (
      <>
        {a1} <br aria-hidden className="sm:hidden" />
        {b1} <br aria-hidden className="hidden sm:block" />
        {a2} <br aria-hidden className="sm:hidden" />
        {b2}
      </>
    );
  } else {
    content = (
      <>
        {line1} <br aria-hidden />
        {line2}
      </>
    );
  }

  return (
    <motion.h1
      {...calmEnter(play, step)}
      className={cn(
        "text-foreground text-4xl leading-[1.06] font-bold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.04] md:text-6xl lg:text-7xl lg:leading-[1.02]",
        className,
      )}
    >
      {content}
    </motion.h1>
  );
}

export function CalmSubtitle({
  play,
  step,
  className,
}: {
  play: boolean;
  step: number;
  className?: string;
}) {
  const { t } = useTranslation("hero");
  return (
    <motion.p
      {...calmEnter(play, step)}
      className={cn(
        "text-muted-foreground mx-auto max-w-[36rem] text-base leading-relaxed text-pretty sm:text-lg",
        className,
      )}
    >
      {t("subtitle")}
    </motion.p>
  );
}

/** Static pill. Same text and link as the live badge, no shimmer or hover scale. */
export function CalmBadge({ play, step }: { play: boolean; step: number }) {
  const { t } = useTranslation("hero");
  return (
    <motion.div {...calmEnter(play, step)} className="flex justify-center">
      <a
        href={JOIN_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-background/70 text-muted-foreground hover:text-foreground hover:border-foreground/25 focus-visible:ring-ring/50 relative inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200 ease-out outline-none after:absolute after:-inset-y-1.5 after:inset-x-0 focus-visible:ring-[3px]"
      >
        <span aria-hidden className="bg-primary size-1.5 rounded-full" />
        {t("announcement")}
      </a>
    </motion.div>
  );
}

/**
 * Primary join plus a quieter showcase button. The arrow trails the label,
 * and both are 44px tall.
 */
export function CalmCtas({
  play,
  step,
  joinHref,
  onViewShowcase,
  showSecondary = true,
  className,
}: {
  play: boolean;
  step: number;
  joinHref: string;
  onViewShowcase: () => void;
  showSecondary?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("hero");
  return (
    <motion.div
      {...calmEnter(play, step)}
      className={cn("flex flex-col justify-center gap-3 sm:flex-row", className)}
    >
      <Button asChild size="lg" className="group h-11 px-6 text-[15px] active:scale-[0.98]">
        <a href={joinHref} target="_blank" rel="noopener noreferrer">
          {t("joinCommunity")}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </a>
      </Button>
      {showSecondary && (
        <Button
          size="lg"
          variant="outline"
          className="text-foreground/80 hover:text-foreground h-11 bg-transparent px-6 text-[15px] active:scale-[0.98] dark:bg-transparent"
          onClick={onViewShowcase}
        >
          {t("ourShowcase")}
        </Button>
      )}
    </motion.div>
  );
}

/** The live Safari mockup and screenshot, entering with the same short fade. */
export function CalmMockup({
  play,
  step,
  className,
}: {
  play: boolean;
  step: number;
  className?: string;
}) {
  return (
    <motion.div {...calmEnter(play, step)} className={cn("mx-auto w-full max-w-6xl", className)}>
      <SafariMockup url="vibedeveloper.id">
        <OptimizedImage
          src="/hero-vibedevid-showcase.png"
          alt="VibeDevID showcase interface"
          width={2880}
          height={1800}
          variantWidths={[640, 960, 1200, 1600, 2400]}
          sizes="(min-width: 1024px) 1152px, 100vw"
          priority
          className="h-auto w-full object-cover"
        />
      </SafariMockup>
    </motion.div>
  );
}
