# 013 — Parallelize home loader

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Performance
- **Rule**: react-doctor/server-sequential-independent-await
- **Estimated scope**: 1 file, small

## Problem

`app/routes/index.tsx:86` waits for categories, videos, and testimonials, then fetches projects. Videos and testimonials do not feed the project query. Categories do (filter validation). Projects wait on the slowest of the first three.

    // app/routes/index.tsx:85 — current
    const [categories, initialVibeVideos, initialTestimonials] = await Promise.all([
      getCategories(),
      getVibeVideos(),
      getApprovedTestimonials(),
    ]);
    ...
    const initialProjects = await fetchProjectsWithSorting(
      initialSort,
      initialFilter === "all" ? undefined : initialFilter,
      20,
    );

Canonical recipe: race independent work with `Promise.all`. When one call depends on another, start the dependent call from that promise and still race it with the unrelated calls.

## Target

    // target
    const categoriesPromise = getCategories();
    const initialSort = normalizeSortParam(getSingleSearchParam(search.sort));
    const requestedFilter = getSingleSearchParam(search.filter);

    const projectsPromise = categoriesPromise.then((categories) => {
      const initialFilter = categoryOptionsFrom(categories, requestedFilter);
      return fetchProjectsWithSorting(
        initialSort,
        initialFilter === "all" ? undefined : initialFilter,
        20,
      ).then((initialProjects) => ({ initialFilter, initialProjects }));
    });

    const [categories, initialVibeVideos, initialTestimonials, projectResult] = await Promise.all([
      categoriesPromise,
      getVibeVideos(),
      getApprovedTestimonials(),
      projectsPromise,
    ]);

Keep the same return keys: `initialProjects`, `initialCategories`, `initialFilter`, `initialSort`, `initialVibeVideos`, `initialTestimonials`.

Extract the existing filter-validation lines into a local helper in the same file (do not export) so `categoryOptions` mapping stays in one place:

    function resolveInitialFilter(
      categories: Awaited<ReturnType<typeof getCategories>>,
      requestedFilter: string | undefined,
    ): string {
      const options = (categories ?? []).map((category) => category.name);
      return requestedFilter && options.includes(requestedFilter) ? requestedFilter : "all";
    }

Do not change the route `loader` that maps `context.currentUser` (`index.tsx:125`).

## Repo conventions to follow

- Keep `loadHomeData` as `createServerFn` so server clients stay off the client bundle.
- Keep `z.object({ filter, sort })` validation.
- Imitate the comment at `index.tsx:127` (reuse root user; do not re-query).

## Steps

1. At `app/routes/index.tsx` `loadHomeData` handler, start `categoriesPromise` and `projectsPromise` as above.
2. Race videos, testimonials, categories, and projects.
3. Keep the same payload shape for `HomePageClient`.

## Boundaries

- Do NOT fetch projects with an unvalidated filter (still require categories).
- Do NOT add dependencies.
- Do NOT move this work into a client `useEffect`.
- STOP if `loadHomeData` has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `server-sequential-independent-await` on this handler. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/` with no search params. Confirm projects, videos, and testimonials still render. Open `/?filter=<valid-category>`. Confirm the filter still applies. Open `/?filter=not-a-category`. Confirm the list falls back to `all`.
- **Done when**: projects overlap videos/testimonials on the server, and filter validation is unchanged.
