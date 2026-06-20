"use client";
import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const [ref, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    setCurrentSpeed(speed);
  }, [speed]);

  useEffect(() => {
    if (prefersReducedMotion) {
      translation.set(0);
      return;
    }

    const size = direction === "horizontal" ? width : height;

    if (!size) return;

    let controls: ReturnType<typeof animate> | undefined;
    let isStopped = false;
    const contentSize = size + gap;
    const from = reverse ? -contentSize / 2 : 0;
    const to = reverse ? 0 : -contentSize / 2;

    const startAnimation = (start: number) => {
      const distanceToTravel = Math.abs(to - start);
      const duration = distanceToTravel / Math.max(currentSpeed, 1);

      controls = animate(translation, [start, to], {
        ease: "linear",
        duration,
        onComplete: () => {
          if (isStopped) return;
          translation.set(from);
          startAnimation(from);
        },
      });
    };

    const current = translation.get();
    const start = Math.abs(current - to) < 1 ? from : current;
    startAnimation(start);

    return () => {
      isStopped = true;
      controls?.stop();
    };
  }, [translation, currentSpeed, width, height, gap, direction, reverse, prefersReducedMotion]);

  const hoverProps =
    speedOnHover && !prefersReducedMotion
      ? {
          onHoverStart: () => setCurrentSpeed(speedOnHover),
          onHoverEnd: () => setCurrentSpeed(speed),
        }
      : {};

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className={cn("flex w-max", prefersReducedMotion && "w-full flex-wrap justify-center")}
        style={{
          ...(prefersReducedMotion
            ? {}
            : direction === "horizontal"
              ? { x: translation }
              : { y: translation }),
          gap: `${gap}px`,
          flexDirection: direction === "horizontal" ? "row" : "column",
        }}
        ref={ref}
        {...hoverProps}
      >
        {children}
        {!prefersReducedMotion && children}
      </motion.div>
    </div>
  );
}
