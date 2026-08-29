# 007 — Reset visible projects on filter

- **Status**: DONE
- **Commit**: c829824
- **Severity**: HIGH
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, small

## Problem

`hooks/useProjectFilters.ts:77` starts `visibleProjects` at 6. `loadMore` at line 157 only increments. Filter and sort refetch projects at line 108, but they do not reset the window. After “Load more”, a new filter can show 18 cards instead of 6.

    // hooks/useProjectFilters.ts:75 — current
    const [selectedFilter, setSelectedFilter] = useState(initialFilter);
    const [selectedTrending, setSelectedTrending] = useState<SortBy>(initialSort);
    const [visibleProjects, setVisibleProjects] = useState(6);
    ...
    const loadMore = () => {
      setVisibleProjects((prev) => prev + 6);
    };

The fetch effect already ignores stale responses with `isActive` + `requestId`. Do not rewrite that guard. Only reset the window.

Used on the landing showcase and `/project/list` (hot path).

## Target

Reset to 6 when `selectedFilter` or `selectedTrending` changes. Keep the increment helper.

    // target — add inside the hook, after the fetch effect
    useEffect(() => {
      setVisibleProjects(6);
    }, [selectedFilter, selectedTrending]);

    const loadMore = () => {
      setVisibleProjects((prev) => prev + 6);
    };

Do not reset on `authReady` alone. That would shrink the list after the first auth flip if the user already loaded more on the same filter.

## Repo conventions to follow

- Keep request-id cancellation as written (`isCurrentProjectRequest`).
- Keep `ALL_FILTER_VALUE = "all"` and `DEFAULT_SORT = "newest"`.
- Do not add TanStack Query.

## Steps

1. At `hooks/useProjectFilters.ts`, add an effect that sets `visibleProjects` to 6 when `selectedFilter` or `selectedTrending` changes.
2. Do not change `loadFilteredProjects` or the skip-initial-fetch ref.
3. If a caller wraps `setSelectedFilter` / `setSelectedTrending`, leave those names unchanged.

## Boundaries

- Do NOT change the page size from 6.
- Do NOT add dependencies.
- Do NOT “fix” the already-guarded `no-set-state-after-await-in-effect` hits in this file.
- STOP if the hook has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` — score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/` or `/project/list`. Click “Load more” until more than 6 cards show. Change category or sort. Confirm the list shows 6 cards again (or fewer if the result set is smaller). Confirm “Load more” still adds 6.
- **Done when**: filter/sort resets the window; load more still works on one filter.
