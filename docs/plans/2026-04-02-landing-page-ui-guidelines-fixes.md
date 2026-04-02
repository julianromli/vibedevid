# Landing Page UI Guidelines Fix Plan

Date: 2026-04-02
Route: `/`
Scope: landing page layout, navbar controls, homepage sections, and project filter state

## Goal

Fix the landing page UI issues found during the Web Interface Guidelines review, with emphasis on accessibility, motion safety, semantic navigation, and shareable state.

## Review Summary

The homepage currently has four main categories of issues:

1. Missing accessibility landmarks and labels.
2. Navigation actions implemented as buttons instead of links.
3. Motion-heavy sections that do not respect `prefers-reduced-motion`.
4. Project filter and sort state that is not reflected in the URL.

## Chosen Direction

### URL State

Use normalized query params for homepage state:

- `sort=trending|top|newest`
- `filter=<stable-category-key>`

Preferred source for `filter` keys:

- Use an existing stable backend identifier if categories already expose one.
- Only fall back to a derived slug from display text if no stable category key exists.

This keeps URLs stable if display names or translations change.

## Final Implementation Plan

### 1. Add page landmarks and skip navigation

Files:

- `app/layout.tsx`
- `app/home-page-client.tsx`

Changes:

- Add a keyboard-accessible skip link near the top of the document.
- Point the skip link to `#main-content`.
- Wrap homepage content in `<main id="main-content">`.

Why:

- Fixes the missing skip-link and main-landmark issues.
- Improves keyboard and screen-reader navigation around the fixed navbar.

### 2. Replace navigation-style buttons with real links

Files:

- `app/home-page-client.tsx`
- `components/sections/hero-section.tsx`
- `components/sections/cta-section.tsx`

Changes:

- Remove `window.open(...)` for the community join CTA.
- Pass href values from the homepage wrapper to sections.
- Render external navigation using `<Link>` or anchor-backed `Button asChild`.
- Keep the “view showcase” control as a button because it triggers in-page scrolling, not navigation.

Why:

- Restores correct navigation semantics.
- Preserves expected browser behaviors such as opening in a new tab and copying links.

### 3. Add labels to icon-only controls

Files:

- `components/ui/navbar.tsx`

Changes:

- Add `aria-label` to the desktop user menu trigger.
- Add `aria-label` to the mobile user menu trigger.
- Add `aria-label` to the mobile menu toggle button.

Why:

- Fixes clear accessibility failures with minimal visual or structural change.

### 4. Rebuild FAQ items as semantic disclosures

Files:

- `components/sections/faq-section.tsx`

Changes:

- Replace clickable card wrappers with native `<button>` triggers inside the cards.
- Add `aria-expanded` and `aria-controls`.
- Add matching trigger and panel ids.
- Preserve current visual layout while making disclosure behavior keyboard-accessible.

Why:

- Fixes the largest section-level semantic issue.
- Uses native button behavior instead of custom click handling on a `div`.

### 5. Add reduced-motion handling across animated sections

Files:

- `components/sections/hero-section.tsx`
- `components/sections/cta-section.tsx`
- `components/sections/ai-leaderboard-section.tsx`
- `components/ui/testimonials-columns.tsx`
- `components/sections/faq-section.tsx`

Changes:

- Respect `prefers-reduced-motion` across all homepage motion-heavy sections.
- Disable or simplify the hero staggered text animation.
- Disable decorative pulsing cards in the CTA section.
- Disable leaderboard entrance, bar-fill, shine, and badge ping animations when reduced motion is requested.
- Disable testimonial auto-scroll in reduced motion.
- Remove or simplify FAQ open/close transitions in reduced motion.

Why:

- Fixes the broadest compliance gap in the landing page.
- Reduces motion-triggered discomfort and improves predictability.

### 6. Make testimonial motion safer and easier to interrupt

Files:

- `components/ui/testimonials-columns.tsx`
- `components/sections/reviews-section.tsx` if needed

Changes:

- In reduced-motion mode, render testimonials as static content without auto-scroll.
- Optionally pause motion on hover or focus in standard mode if the current UX remains animated.

Why:

- Infinite moving content is the strongest issue in the testimonials section.

### 7. Sync project filter and sort state to the URL

Files:

- `hooks/useProjectFilters.ts`
- `components/sections/project-showcase.tsx` if small UI wiring changes are needed
- `app/home-page-client.tsx` if initial state plumbing changes are needed

Changes:

- Read initial `filter` and `sort` values from query params.
- Write valid state changes back into the URL.
- Preserve current defaults when params are absent or invalid.
- Normalize category keys using backend-provided stable identifiers if available.
- Gracefully fall back to defaults for unknown query values.

Why:

- Makes the landing page state deep-linkable and shareable.
- Aligns homepage controls with the guideline that URL should reflect meaningful UI state.

## Verification Plan

### Manual checks

- Keyboard navigation:
  - skip link
  - desktop user menu trigger
  - mobile user menu trigger
  - mobile menu toggle
  - FAQ disclosure controls
- Reduced-motion behavior with OS/browser reduced motion enabled
- Homepage filter/sort URL deep-linking
- Mobile and desktop homepage layout checks

### Commands

- `bunx tsc --noEmit`
- `bun run lint`

## Recommended Execution Order

1. Landmarks and skip link
2. CTA link semantics
3. Navbar `aria-label` fixes
4. FAQ disclosure semantics
5. Reduced-motion sweep
6. URL sync for filter and sort state
7. Verification pass

## Notes

- Keep changes minimal and localized to the homepage and shared primitives directly used by it.
- Do not introduce alternate interaction patterns if the native semantic element already solves the issue.
- Prefer static behavior over replacement motion in reduced-motion mode.
