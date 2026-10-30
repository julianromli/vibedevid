---
version: alpha
name: VibeDev ID
description: Dark-first, monochrome interface for an Indonesian community of developers, vibe coders and AI enthusiasts. Light is the toggle option.
colors:
  background: oklch(0.145 0 0)
  foreground: oklch(0.985 0 0)
  card: oklch(0.178 0 0)
  card-foreground: oklch(0.985 0 0)
  popover: oklch(0.205 0 0)
  popover-foreground: oklch(0.985 0 0)
  primary: oklch(0.985 0 0)
  primary-foreground: oklch(0.145 0 0)
  secondary: oklch(0.25 0 0)
  secondary-foreground: oklch(0.985 0 0)
  muted: oklch(1 0 0 / 7.1%)
  muted-foreground: oklch(0.708 0 0)
  accent: oklch(0.25 0 0)
  accent-foreground: oklch(0.985 0 0)
  destructive: "#e54d2e"
  destructive-hover: "#ec6142"
  destructive-active: "#ff977d"
  destructive-foreground: "#ffffff"
  danger-subtle: "#ff55330f"
  danger-subtle-hover: "#ff35232b"
  danger-subtle-active: "#fe332153"
  danger-foreground: "#ff6847eb"
  brand: "#0090ff"
  brand-hover: "#3b9eff"
  brand-foreground: "#ffffff"
  component: oklch(1 0 0 / 7.1%)
  component-hover: oklch(1 0 0 / 10.5%)
  component-active: oklch(1 0 0 / 13.4%)
  subtle-foreground: oklch(1 0 0 / 68.5%)
  disabled: oklch(1 0 0 / 3.4%)
  disabled-foreground: oklch(1 0 0 / 33.2%)
  border: oklch(1 0 0 / 10.5%)
  input: oklch(0.32 0 0)
  field: oklch(0.556 0 0)
  ring: oklch(0.708 0 0)
typography:
  sans:
    fontFamily: Geist Variable
  mono:
    fontFamily: Geist Mono Variable
rounded:
  base: 0.5rem
spacing:
  base: 0.25rem
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: 6px
    height: 36px
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.component}"
    textColor: "{colors.foreground}"
  button-secondary-hover:
    backgroundColor: "{colors.component-hover}"
  button-tertiary:
    backgroundColor: "{colors.component}"
    textColor: "{colors.subtle-foreground}"
  button-tertiary-hover:
    backgroundColor: "{colors.component-hover}"
  button-tertiary-active:
    backgroundColor: "{colors.component-active}"
  button-brand:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-foreground}"
  button-brand-hover:
    backgroundColor: "{colors.brand-hover}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
  button-destructive-hover:
    backgroundColor: "{colors.destructive-hover}"
  button-destructive-active:
    backgroundColor: "{colors.destructive-active}"
  button-danger-subtle:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger-foreground}"
  button-danger-subtle-hover:
    backgroundColor: "{colors.danger-subtle-hover}"
  button-danger-subtle-active:
    backgroundColor: "{colors.danger-subtle-active}"
  button-ghost:
    textColor: "{colors.subtle-foreground}"
  button-ghost-hover:
    backgroundColor: "{colors.component-hover}"
    textColor: "{colors.foreground}"
  button-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "{colors.disabled-foreground}"
  badge-destructive:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger-foreground}"
  input-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: 6px
    height: 40px
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: 12px
---

# VibeDev ID

## Overview

VibeDev ID is the Indonesian community for developers, vibe coders and AI enthusiasts: people showcase projects, write blog posts and join events. The interface is dark-first and monochrome, so the color on screen comes from community content (project screenshots, blog covers, event images), not from the chrome. Light theme stays available through the theme toggle.

## Colors

Components use semantic tokens through their Tailwind utilities (`bg-card`, `text-muted-foreground`, `border-border`). Raw palette classes (`bg-zinc-*`, `text-gray-*`) and hex values are only for content-bound cases: white text and black scrims placed over photos or video, third-party brand marks (YouTube, the verified badge), and the hero terminal's own palette.

Surfaces get lighter as they rise: `background` for the page, `card` for grouped containers and the sidebar, `popover` for anything that floats over content (menus, dialogs, tooltips). Hover and selected rows use `accent`.

The interface has two hues and each has one job. `destructive` (tomato) marks delete or no-undo actions and errors. `brand` (blue) is only for promo or upgrade calls to action and the first chart series. No other hue goes into UI chrome. The one exception is status markers, which keep their own status hue: green for success, active, approved, published and the online dot; yellow or amber for pending, featured, needs-attention and near-limit counters; blue for the Moderator role and the active link in the editor toolbar; red for the Admin role. Content marks keep their own color too: the YouTube icon, the filled like heart and the editor's AI purple. Errors and destructive states always use the `destructive` tokens, never a palette red.

`border`, `muted` and the `component` family are translucent white in dark, so one token reads correctly on every surface. Use them instead of choosing a different gray per surface.

Edges have three roles: `field` for text inputs, textareas and upload dropzones (it keeps the edge visible against every surface); `border` for dividers and card edges; `input` for outline-button edges.

Buttons focus with the full `ring` color; text fields switch their edge to `primary` and add a `primary` ring. Both use a `ring-offset-background` gap. Placeholders use full `muted-foreground`.

White labels on `brand` and `destructive` fills are below the AA text-contrast floor. This is an accepted trade-off for the Interfere look, so keep those labels to one short action.

## Themes

The frontmatter holds the dark (default) values. The light theme, applied without the `.dark` class, uses these values:

| Token                | Dark (default)       | Light                |
| -------------------- | -------------------- | -------------------- |
| background           | oklch(0.145 0 0)     | oklch(0.985 0 0)     |
| foreground           | oklch(0.985 0 0)     | oklch(0.145 0 0)     |
| card                 | oklch(0.178 0 0)     | oklch(1 0 0)         |
| popover              | oklch(0.205 0 0)     | oklch(1 0 0)         |
| primary              | oklch(0.985 0 0)     | oklch(0.145 0 0)     |
| primary-foreground   | oklch(0.145 0 0)     | oklch(0.985 0 0)     |
| secondary / accent   | oklch(0.25 0 0)      | oklch(0.94 0 0)      |
| muted                | oklch(1 0 0 / 7.1%)  | oklch(0.97 0 0)      |
| muted-foreground     | oklch(0.708 0 0)     | oklch(0.439 0 0)     |
| destructive-hover    | #ec6142              | #dd4425              |
| destructive-active   | #ff977d              | #d13415              |
| danger-subtle        | #ff55330f            | #ff200008            |
| danger-subtle-hover  | #ff35232b            | #f52b0018            |
| danger-subtle-active | #fe332153            | #ff2e003d            |
| danger-foreground    | #ff6847eb            | #d72400da            |
| brand-hover          | #3b9eff              | #0588f0              |
| component            | oklch(1 0 0 / 7.1%)  | oklch(0 0 0 / 6.3%)  |
| component-hover      | oklch(1 0 0 / 10.5%) | oklch(0 0 0 / 9%)    |
| component-active     | oklch(1 0 0 / 13.4%) | oklch(0 0 0 / 12.2%) |
| subtle-foreground    | oklch(1 0 0 / 68.5%) | oklch(0 0 0 / 60.8%) |
| disabled             | oklch(1 0 0 / 3.4%)  | oklch(0 0 0 / 6.3%)  |
| disabled-foreground  | oklch(1 0 0 / 33.2%) | oklch(0 0 0 / 26.7%) |
| border               | oklch(1 0 0 / 10.5%) | oklch(0.922 0 0)     |
| input                | oklch(0.32 0 0)      | oklch(0.94 0 0)      |
| ring                 | oklch(0.708 0 0)     | oklch(0.556 0 0)     |

`destructive`, `destructive-foreground`, `brand`, `brand-foreground` and `field` are the same in both themes.

## Typography

Geist sets all interface text. Geist Mono is for code, commands and the terminal-style hero; use `font-mono` and do not load another monospace face.

Text inputs and textareas use `text-base` below `md` and `text-sm` from `md`, so iOS does not zoom the page on focus.

## Layout

Page content sits in `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`. The navbar uses the same width when it turns into the floating bar on scroll, so the bar lines up with the content below it.

Spacing uses the `spacing.base` unit through the Tailwind spacing scale; do not use arbitrary pixel spacing.

## Elevation & Depth

In dark, a layer is raised by a lighter surface plus a `border`; the shadow only adds to it. Cards take `shadow-sm`, floating layers take larger shadows, and the dark shadow set is stronger than the light one, because a light shadow does not show on the dark background.

Dialogs, alert dialogs, drawers and sheets share one backdrop: `bg-black/50`.

## Shapes

Every radius comes from `rounded.base`: `rounded-md` for buttons, inputs and badges, `rounded-lg` for large buttons and popovers, `rounded-xl` for cards and dialogs. A child inside a padded parent takes a smaller radius than the parent.

## Components

The button variants are a closed set: `default`, `secondary`, `tertiary`, `brand`, `destructive`, `danger-subtle`, `ghost`, `outline` and `link`. Choose one with this tree:

```text
Most important action on the view?
 ├── Yes → default (one per view)
 └── No
      ├── Last step of a delete or no-undo action? → destructive
      ├── Starts a delete flow (opens the confirm)? → danger-subtle
      ├── Promo or upgrade call to action? → brand (one per page)
      ├── Goes to another page? → Link, or variant="link"
      ├── Toolbar, icon-only or Cancel? → ghost
      ├── Low-weight action in a group of three or more? → tertiary
      ├── Filter or toggle on a busy area? → outline
      └── Default → secondary
```

Buttons press to `scale-[0.97]` and keep their colors-then-scale transition from `buttonVariants`; with reduced motion the press does not scale. On touch screens a `::before` box extends every button's hit area, so do not add padding to make a small button easier to tap. A button placed inside a field (a clear or show-password button) adds `before:hidden`, so its hit area does not cover the text.

Every text field is an `Input`, `InputWithIcon` or `Textarea`; their shared look lives in `fieldClassName` (`components/ui/form-classes.ts`), so call sites pass layout and size only, never colors, borders or focus styles. The auth card and the submit form use the larger `authInputClassName` size. A field always has a visible `Label` or an `aria-label`; the placeholder is an example, not the label. Icons drawn over a field take `pointer-events-none`. A textarea that is the only field of a posting form (the comment box) also submits on Cmd/Ctrl+Enter; in multi-field forms, Enter in a textarea only adds a new line.

Tech-stack tags use the `secondary` badge. A `destructive` badge uses the danger-subtle look, not a solid fill.

## Do's and Don'ts

- Do use semantic token utilities in components; don't use raw palette classes or hex for interface chrome. The status markers listed under Colors are the only exception.
- Don't lower the focus ring's opacity (`ring-ring/50`); use the full ring with an offset.
- Don't make text quieter with opacity below `/80`; use `muted-foreground` or `subtle-foreground`.
- Don't add a hue or a button variant outside the sets above.
