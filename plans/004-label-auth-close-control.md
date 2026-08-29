# 004 — Label auth close control

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Accessibility
- **Rule**: react-doctor/control-has-associated-label
- **Estimated scope**: 1 file, small

## Problem

`app/user/auth/page.tsx:75` is an icon-only close control. The `<a>` wraps a `Button` with only `<X />`. There is no visible text, `aria-label`, or `aria-labelledby`. Screen-reader users on `/user/auth` cannot tell the destination.

    // app/user/auth/page.tsx:75 — current
    <a href="/" className="absolute top-6 right-6">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors duration-200 hover:cursor-pointer hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </a>

Canonical recipe: give the control a persistent accessible name. Prefer visible text or an associated label. Use `aria-label` for a truly icon-only control.

## Target

Put `aria-label` on the link (the actual control). Hide the decorative icon from AT. Prefer a `Link` to `/` so the router owns navigation.

    // target
    <Link
      to="/"
      aria-label="Go to home"
      className="absolute top-6 right-6"
    >
      <span
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors duration-200 hover:cursor-pointer hover:text-foreground",
        )}
        aria-hidden="true"
      >
        <X className="h-4 w-4" />
      </span>
    </Link>

`buttonVariants` is already imported at `app/user/auth/page.tsx:9`. `Link` is already imported at line 5. If you keep the nested `Button`, put `aria-label="Go to home"` on the `<a>` or `Link` and `aria-hidden="true"` on `<X />`. Do not leave a button without a name inside a named link.

## Repo conventions to follow

- Imitate `components/event/event-filter-controls.tsx:91` (`aria-label="Grid view"` on an icon-only control).
- Imitate `components/ui/language-switcher.tsx:47` (`<span className="sr-only">Switch language</span>` is also valid).
- Keep sentence case. Do not use “OK” or “Close” without a destination. The destination is home.

## Steps

1. At `app/user/auth/page.tsx:75`, add an accessible name that states the destination (“Go to home”).
2. Prefer `Link` to `/` instead of a raw `<a href="/">`.
3. Keep the visual position (`absolute top-6 right-6`) and the ghost circular style.

## Boundaries

- Do NOT change sign-in, sign-up, or reset form logic.
- Do NOT add dependencies.
- STOP if the close control has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `control-has-associated-label` at `app/user/auth/page.tsx`. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/user/auth`. Tab to the top-right control. Confirm the accessible name is “Go to home”. Activate it and land on `/`. Confirm the icon still looks the same.
- **Done when**: the diagnostic is gone and the control name states the destination.
