"use client";
import { useCallback, useEffect, useState } from "react";

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    const y = window.scrollY;
    // Hysteresis: turn on above the threshold, off only below half of it,
    // so a scroll that stops near the edge does not flip the state back and forth.
    setScrolled((prev) => (prev ? y > threshold / 2 : y > threshold));
  }, [threshold]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // also check on first load
  useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
