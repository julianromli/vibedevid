"use client";

import { useHydrated } from "@tanstack/react-router";
import { Moon, SunDim } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type props = {
  className?: string;
};

export const ThemeToggle = ({ className }: props) => {
  const { setTheme, resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const changeTheme = async () => {
    if (!buttonRef.current) return;

    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Check if browser supports view transitions
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    }).ready;

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRad}px at ${x}px ${y}px)`],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  };

  return (
    <Button
      variant={"ghost"}
      ref={buttonRef}
      onClick={changeTheme}
      size={"icon"}
      className={cn(
        "rounded-full transition-opacity duration-200 hover:cursor-pointer hover:opacity-80 focus:outline-none",
        className,
      )}
      // resolvedTheme is unknown during SSR, so the label waits for hydration and
      // the icon is picked by the `dark` class (set before paint) instead of state.
      aria-label={
        hydrated ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode` : "Toggle theme"
      }
    >
      <SunDim className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
};
