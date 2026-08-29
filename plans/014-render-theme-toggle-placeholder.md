# 014 — Render theme toggle on first paint

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-initialize-state
- **Estimated scope**: 1 file, small

## Problem

`components/ui/theme-toggle.tsx:23` returns nothing until a mount effect sets `mounted`. The placeholder at lines 63–68 never runs. The navbar has a hole until hydration.

    // components/ui/theme-toggle.tsx:14 — current
    export const ThemeToggle = ({ className }: props) => {
      const { setTheme, resolvedTheme } = useTheme();
      const [mounted, setMounted] = useState(false);
      ...
      useEffect(() => {
        setMounted(true);
      }, []);

      if (!mounted) return;

      const changeTheme = async () => { ... };

      if (!mounted) {
        return (
          <button className={cn("opacity-0", className)} disabled>
            <Moon />
          </button>
        );
      }

Canonical `no-initialize-state` recipe: do not load an initial value from a mount effect. For browser-only theme, render the same control on the server and the client. `html` already has `suppressHydrationWarning`.

Run this after plan `001` (always-on `ThemeProvider`).

## Target

Render one icon button on the server and the first client paint. Do not return `undefined`. Keep `aria-label` on the live control.

    // target
    export const ThemeToggle = ({ className }: props) => {
      const { setTheme, resolvedTheme } = useTheme();
      const buttonRef = useRef<HTMLButtonElement | null>(null);
      const [mounted, setMounted] = useState(false);

      useEffect(() => {
        setMounted(true);
      }, []);

      const changeTheme = async () => {
        if (!buttonRef.current) return;
        ...
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
          aria-label={
            mounted
              ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
              : "Switch color theme"
          }
        >
          {mounted && resolvedTheme === "dark" ? (
            <SunDim className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>
      );
    }

If `resolvedTheme` is missing on the first client paint, keep the `Moon` icon. Do not unmount the button.

You may delete `mounted` entirely if `useTheme()` is safe after plan `001`. Then always read `resolvedTheme` and keep one `aria-label`. Prefer that if it does not throw during SSR.

## Repo conventions to follow

- Imitate `components/ui/language-switcher.tsx:43` (same-size placeholder, not an empty return).
- Keep `flushSync` + View Transitions as they are.
- Keep `disableTransitionOnChange` behavior from the provider (`001`).

## Steps

1. Remove `if (!mounted) return` from `components/ui/theme-toggle.tsx`.
2. Always render the `Button` with an `aria-label`.
3. Delete the unreachable placeholder block at lines 63–68.
4. Do not edit `ClientThemeProvider` here.

## Boundaries

- Do NOT add dependencies.
- Do NOT use `outline: none` without the existing `focus:outline-none` replacement already on the button (leave focus styles as they are unless you add `focus-visible` only).
- STOP if the toggle has drifted from commit `c829824` (or from `001`).

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `no-initialize-state` / `control-has-associated-label` on this file. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/` and `/user/auth`. Confirm the toggle is present before and after hydration (no hole in the navbar). Confirm the accessible name is not empty. Toggle theme once. Confirm the icon swaps.
- **Done when**: first paint includes the control, and theme still switches.
