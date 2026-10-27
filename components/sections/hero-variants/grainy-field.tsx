/**
 * Grainy gradient field (grainy-gradient recipe): a light-cool-top to
 * dark-warm-bottom base, four analogous blobs on the edges, and a 1 physical
 * pixel noise tile on top. Blobs drift slowly and lean toward the pointer;
 * all motion is off under prefers-reduced-motion.
 */
"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { type PointerEvent, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Gold dusk: sand, gold, amber, burnt orange. Neighbours of the brand gold. */
const BASE =
  "linear-gradient(180deg, #d8d5ca 0%, #e9d18f 30%, #e2a238 55%, #9c4f17 78%, #1c0d05 100%)";

const BLOBS = [
  { color: "#dedbd0", x: 18, y: 0, size: 100, duration: 22, delay: 0 },
  { color: "#f3d576", x: 100, y: 40, size: 90, duration: 26, delay: -7 },
  { color: "#f0a52a", x: 0, y: 70, size: 90, duration: 28, delay: -13 },
  { color: "#5a280b", x: 80, y: 104, size: 100, duration: 20, delay: -4 },
];

// Spring from the recipe: stiffness 70, damping ratio 0.86 (mass 1).
const SPRING = { stiffness: 70, damping: 2 * 0.86 * Math.sqrt(70), mass: 1 };

function useGrainTile(): { url: string; size: number } | null {
  const [tile, setTile] = useState<{ url: string; size: number } | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(128, 128);
    for (let index = 0; index < image.data.length; index += 4) {
      // 128 ± 70: full-range noise speckles saturated colors.
      const value = 58 + Math.random() * 140;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    setTile({ url: canvas.toDataURL(), size: 128 / (window.devicePixelRatio || 1) });
  }, []);
  return tile;
}

export function GrainyField({ className, children }: { className?: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const grain = useGrainTile();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, SPRING);
  const y = useSpring(pointerY, SPRING);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Blobs lean ~9% of the field toward the cursor.
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * rect.width * 0.09 * 2);
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * rect.height * 0.09 * 2);
  };

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className={cn("relative isolate overflow-hidden", className)}
      style={{ background: BASE }}
    >
      <style>{`
        @keyframes vd-grain-drift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -2.5%) scale(1.06); }
          100% { transform: translate(-2.5%, 3%) scale(0.96); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-grain-blob] { animation: none !important; }
        }
      `}</style>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={reduce ? undefined : { x, y }}
      >
        {BLOBS.map((blob) => (
          <div
            key={blob.color}
            data-grain-blob
            className="absolute rounded-full"
            style={{
              width: `${blob.size}%`,
              aspectRatio: "1",
              left: `calc(${blob.x}% - ${blob.size / 2}%)`,
              top: `calc(${blob.y}% - ${blob.size / 2}%)`,
              background: `radial-gradient(closest-side, ${blob.color} 0%, color-mix(in oklab, ${blob.color} 78%, transparent) 25%, color-mix(in oklab, ${blob.color} 45%, transparent) 50%, color-mix(in oklab, ${blob.color} 16%, transparent) 75%, transparent 100%)`,
              filter: "blur(18px)",
              animation: `vd-grain-drift ${blob.duration}s ease-in-out ${blob.delay}s infinite alternate`,
            }}
          />
        ))}
      </motion.div>
      {grain ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url(${grain.url})`,
            backgroundSize: `${grain.size}px ${grain.size}px`,
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.14)]" />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
