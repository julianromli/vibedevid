"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createDigitalWaves } from "@/lib/digital-waves";
import { cn } from "@/lib/utils";

interface DigitalWaterProps {
  className?: string;
}

// The renderer paints its own dark backdrop, so it only mounts in dark mode.
export function DigitalWater({ className }: DigitalWaterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || resolvedTheme !== "dark") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let waves: ReturnType<typeof createDigitalWaves> | undefined;
    let disposed = false;
    let visible = true;

    // Skip the shader passes while the hero is scrolled out of view.
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!waves || reducedMotion) return;
      if (visible) waves.play();
      else waves.pause();
    });
    visibility.observe(canvas);

    document.fonts
      .load('12.5px "Digital Mono"')
      .catch(() => undefined)
      .then(() => {
        if (disposed) return;
        try {
          waves = createDigitalWaves(canvas, {
            paused: reducedMotion || !visible,
            interactive: false,
          });
        } catch {
          // No WebGL: the canvas stays empty and the grid behind it shows through.
        }
      });

    return () => {
      disposed = true;
      visibility.disconnect();
      waves?.destroy();
    };
  }, [resolvedTheme]);

  return <canvas ref={canvasRef} className={cn("hidden h-full w-full dark:block", className)} />;
}
