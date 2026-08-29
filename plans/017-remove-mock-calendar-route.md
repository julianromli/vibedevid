# 017 — Redirect mock /calendar to events

- **Status**: DONE
- **Commit**: c829824
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: Beyond the scan
- **Estimated scope**: 3–4 files, small

## Problem

`/calendar` is a live route (`app/routes/calendar.tsx`) that renders `app/calendar/page.tsx`. That page uses hardcoded `mockEvents` (January 2025) and local `useState`. The navbar points to `/event/list`. The sitemap still advertises `/calendar`:

    // app/routes/calendar.tsx:5 — current
    export const Route = createFileRoute("/calendar")({
      head: () => ({
        meta: [
          { title: "Kalender Event | VibeDev ID" },
          { name: "description", content: "Kalender event, meetup, dan workshop AI & coding dari komunitas VibeDev ID." },
        ],
        links: [{ rel: "canonical", href: absoluteUrl("/calendar") }],
      }),
      component: CalendarRoute,
    });

    // app/routes/sitemap[.]xml.ts:12 — current
    { path: "/calendar", priority: "0.5", changefreq: "weekly" },

Product decision: remove the mock calendar from the public surface. Redirect `/calendar` to `/event/list`. Do not keep a noindex mock page.

`components/ui/calendar.tsx` is the date-picker primitive. Do not delete it.

## Target

    // target — app/routes/calendar.tsx
    import { createFileRoute, redirect } from "@tanstack/react-router";

    export const Route = createFileRoute("/calendar")({
      beforeLoad: () => {
        throw redirect({ to: "/event/list" });
      },
    });

    // target — sitemap
    // delete the `/calendar` STATIC_ROUTES entry

    // target — delete app/calendar/page.tsx after the route no longer imports it

Keep `components/ui/calendar.tsx`. Do not delete unused leftovers `components/date-range-picker.tsx` or `components/calendar-date-picker.tsx` in this plan.

## Repo conventions to follow

- Imitate `app/routes/blog.editor.tsx:20` (`throw redirect({ to: "..." })` in `beforeLoad`).
- Imitate `app/routes/project.$slug.tsx:24` (`throw redirect` from `@tanstack/react-router`).
- After the file change, let `app/routeTree.gen.ts` regenerate on the next `vp dev` / `vp build`. Do not hand-edit the route tree unless the repo already requires a checked-in update.

## Steps

1. Replace `app/routes/calendar.tsx` with a `beforeLoad` redirect to `/event/list`.
2. Remove `{ path: "/calendar", ... }` from `app/routes/sitemap[.]xml.ts`.
3. Delete `app/calendar/page.tsx` if nothing else imports it.
4. Update README: the calendar feature is `/event/list`. `/calendar` redirects there.
5. Search for leftover `/calendar` links in app source (not docs/plans history) and point them to `/event/list`.

## Boundaries

- Do NOT delete `components/ui/calendar.tsx`.
- Do NOT add dependencies.
- Do NOT implement a real calendar UI in this plan.
- STOP if `/calendar` is already wired to live events (it is not at `c829824`).

## Verification

- **Mechanical**:
  - `vp check` and `vp test`.
  - Confirm `rg "/calendar" --glob '!docs/**' --glob '!plans/**'` only hits the redirect route and any date-picker class names.
  - `npx react-doctor@latest --scope changed` — score does not drop.
- **Behavior check**: Visit `/calendar`. Confirm a redirect to `/event/list`. Open `/sitemap.xml` and confirm `/calendar` is absent. Confirm `/event/list` still lists real events.
- **Done when**: the mock page is gone, crawlers no longer see `/calendar`, and old URLs land on events.
