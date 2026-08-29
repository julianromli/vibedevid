# 005 — Navbar transform, not margin

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Performance
- **Rule**: react-doctor/no-layout-property-animation
- **Estimated scope**: 1 file, small

## Problem

`components/ui/navbar.tsx:348` animates `marginTop` on scroll. That property forces layout every frame. The navbar is on every public page.

    // components/ui/navbar.tsx:339 — current
    <motion.div
      className={cn(
        "mx-auto w-full border-b",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md md:max-w-7xl md:rounded-2xl md:border-border/50 md:bg-background/80 md:shadow-md md:backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
      initial={false}
      animate={{
        marginTop: scrolled ? 16 : 0,
        borderRadius: scrolled ? 16 : 0,
      }}
      transition={springTransition}
      style={{ marginLeft: "auto", marginRight: "auto" }}
    >

Canonical recipe: for visual-only movement, establish final geometry and animate `translate` / `scale` and opacity. Do not interpolate margin. See https://motion.dev/docs/react-layout-animations

`borderRadius` is not a layout size key in this rule. You may keep it. The required change is `marginTop` → `y` (or `transform`).

## Target

    // target
    <motion.div
      className={cn(
        "mx-auto w-full border-b",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md md:max-w-7xl md:rounded-2xl md:border-border/50 md:bg-background/80 md:shadow-md md:backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
      initial={false}
      animate={{
        y: scrolled ? 16 : 0,
        borderRadius: scrolled ? 16 : 0,
      }}
      transition={springTransition}
      style={{ marginLeft: "auto", marginRight: "auto" }}
    >

Keep `springTransition` at `components/ui/navbar.tsx:29`. Keep the existing `scale` / `x` animation on the brand `motion.div` at line 356.

Honor reduced motion: this file already uses Motion springs. Do not add `transition: all`.

## Repo conventions to follow

- Imitate `components/ui/navbar.tsx:78` (`animate={{ y: 0, opacity: 1 }}` on the mobile menu — transform, not margin).
- Keep `useScroll` as the scrolled source.

## Steps

1. At `components/ui/navbar.tsx:348`, replace `marginTop` with `y`. Keep the 16 / 0 values.
2. Do not change nav items, auth buttons, or dropdowns.
3. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the scroll threshold in `useScroll`.
- Do NOT add dependencies.
- Do NOT replace `borderRadius` with `scale` (that would distort the bar).
- STOP if the navbar animation object has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `no-layout-property-animation` at `components/ui/navbar.tsx:348`. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/`. Scroll until the compact bar appears. Confirm a 16 px gap from the top and rounded corners on `md`. Confirm the bar does not jump 1–2 px more than today. In React DevTools Profiler, confirm the scroll animation no longer attributes layout to `marginTop`. Use “Highlight updates” only to confirm the navbar still updates on the scroll threshold, not on every pixel if that was already gated.
- **Done when**: the diagnostic is gone and the compact navbar still sits 16 px from the top.
