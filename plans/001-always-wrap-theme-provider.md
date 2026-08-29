# 001 — Always wrap ThemeProvider

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: react-doctor/no-initialize-state
- **Estimated scope**: 1 file, small

## Problem

`components/client-theme-provider.tsx:10` delays `ThemeProvider` until a mount effect. First paint wraps `<Outlet />` in a Fragment. After mount the parent type becomes `ThemeProvider`. React remounts the full tree on every session.

    // components/client-theme-provider.tsx:10 — current
    export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
      const [mounted, setMounted] = useState(false);

      useEffect(() => {
        setMounted(true);
      }, []);

      if (!mounted) {
        return <>{children}</>;
      }

      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      );
    }

`app/routes/__root.tsx:67` already sets `suppressHydrationWarning` on `<html>`. `app/routes/__root.tsx:103` wraps `<Outlet />` in this provider. The delay is not required.

Canonical `no-initialize-state` recipe: do not load an initial value into state from a mount effect. For SSR, keep server and first client output the same. Do not switch the parent type after paint.

## Target

Always wrap with `ThemeProvider`. Remove `mounted` state and the mount effect.

    // target
    export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
      return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      );
    }

Keep `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`.

## Repo conventions to follow

- Imitate the thin wrapper at `components/theme-provider.tsx:6` (`NextThemesProvider` always wraps `children`).
- Keep the import of `ThemeProvider` from `next-themes` in this file. Do not switch to the unused `components/theme-provider.tsx` wrapper unless you also delete the duplicate.
- Do not add `useEffect` for theme boot.

## Steps

1. At `components/client-theme-provider.tsx`, delete `useState`, `useEffect`, and the `mounted` branch.
2. Always return `ThemeProvider` with the same props as today.
3. Remove unused React hook imports.
4. Do not edit `ThemeToggle` here. That is plan `014`.

## Boundaries

- Do NOT change public component APIs or theme tokens.
- Do NOT add dependencies.
- Do NOT remove `suppressHydrationWarning` from `app/routes/__root.tsx`.
- STOP if `ClientThemeProvider` no longer matches commit `c829824`; report the drift.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `no-initialize-state` on this file. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/` and `/project/list`. Confirm the theme class on `<html>` still follows system/user preference. Confirm client navigation does not remount the page after first paint (React DevTools: the `Outlet` instance stays mounted). Confirm no flash that unmounts the navbar.
- **Done when**: the delayed-provider remount is gone, theme still works, and checks pass.
