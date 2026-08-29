# 006 — Honor event sort control

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files + 1 test, small

## Problem

`app/event/list/event-list-client.tsx:54` stores `selectedSort` (`"nearest" | "latest"`). `EventFilterControls` at line 107 writes it. `applyFilters` at line 72 never receives it. `lib/events-utils.ts:149` always calls `sortByNearestDate`.

    // app/event/list/event-list-client.tsx:71 — current
    const filteredEvents = applyFilters(initialEvents, {
      category: selectedCategory,
      locationType: selectedLocation,
    });

    // lib/events-utils.ts:127 — current
    export interface EventFilters {
      category?: EventCategory | "All";
      locationType?: EventLocationType | "All";
      startDate?: string;
      endDate?: string;
    }

    export function applyFilters(events: AIEvent[], filters: EventFilters): AIEvent[] {
      ...
      return sortByNearestDate(filtered);
    }

“Terbaru” does not change the list. That is a broken control, not a style nit.

## Target

Add `sort?: "nearest" | "latest"` to `EventFilters` (default `"nearest"`). Add `sortByLatestDate` (sort by `date` descending, then `time` descending). Call it when `filters.sort === "latest"`.

    // target — applyFilters
    export interface EventFilters {
      category?: EventCategory | "All";
      locationType?: EventLocationType | "All";
      startDate?: string;
      endDate?: string;
      sort?: "nearest" | "latest";
    }

    export function sortByLatestDate(events: AIEvent[]): AIEvent[] {
      return [...events].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
    }

    export function applyFilters(events: AIEvent[], filters: EventFilters): AIEvent[] {
      let filtered = events;
      if (filters.category) {
        filtered = filterByCategory(filtered, filters.category);
      }
      if (filters.locationType) {
        filtered = filterByLocation(filtered, filters.locationType);
      }
      if (filters.startDate || filters.endDate) {
        filtered = filterByDateRange(filtered, filters.startDate, filters.endDate);
      }
      if (filters.sort === "latest") {
        return sortByLatestDate(filtered);
      }
      return sortByNearestDate(filtered);
    }

    // target — event-list-client.tsx
    const filteredEvents = applyFilters(initialEvents, {
      category: selectedCategory,
      locationType: selectedLocation,
      sort: selectedSort,
    });

Also reset sort in the empty-state “Reset filter” handler at `event-list-client.tsx:138` (`setSelectedSort("nearest")`).

## Repo conventions to follow

- Keep sort helpers next to `sortByNearestDate` in `lib/events-utils.ts`.
- Imitate `tests/unit/lib/events.spec.ts` (`describe` / `it` / `vite-plus/test`). Add `tests/unit/lib/events-utils.spec.ts` with two fixtures that prove nearest vs latest order.
- Do not change `EventFilterControls` labels (`Terdekat` / `Terbaru`).

## Steps

1. Extend `EventFilters` and `applyFilters` in `lib/events-utils.ts`.
2. Pass `sort: selectedSort` from `app/event/list/event-list-client.tsx`.
3. Reset sort in the empty-state handler.
4. Add unit tests for `applyFilters` sort.

## Boundaries

- Do NOT change event loaders or approval flow.
- Do NOT add dependencies.
- Do NOT sort by `status` for “latest”; use calendar `date` + `time`.
- STOP if `applyFilters` has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `vp test` focused on `tests/unit/lib/events-utils.spec.ts`.
  - `npx react-doctor@latest --scope changed` — score does not drop.
  - `vp check`.
- **Behavior check**: Open `/event/list` with at least two events on different dates. Select “Terbaru”. Confirm the later `date` is first. Select “Terdekat”. Confirm upcoming events still win over past events (existing `sortByNearestDate` rules).
- **Done when**: the control changes list order and tests pin both sorts.
