"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Matches `--animate-auth-step-out` in globals.css. */
export const STEP_EXIT_MS = 120;

/**
 * Fades the current step out before the next one mounts (and plays its own
 * step-in). The leaving step keeps its last props, stays in the same tree
 * position so it does not remount, and is inert while it fades.
 */
export function StepTransition({ stepKey, children }: { stepKey: string; children: ReactNode }) {
  const [shownKey, setShownKey] = useState(stepKey);
  const lastShown = useRef<ReactNode>(children);
  const leaving = stepKey !== shownKey;

  useLayoutEffect(() => {
    if (!leaving) lastShown.current = children;
  });

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setShownKey(stepKey), STEP_EXIT_MS);
    return () => window.clearTimeout(id);
  }, [leaving, stepKey]);

  return (
    <div
      data-step={shownKey}
      data-leaving={leaving || undefined}
      className={leaving ? "pointer-events-none animate-auth-step-out" : undefined}
      inert={leaving || undefined}
    >
      {leaving ? lastShown.current : children}
    </div>
  );
}
