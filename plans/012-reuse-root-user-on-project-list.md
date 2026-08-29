# 012 — Reuse root user on project list

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Performance
- **Rule**: react-doctor/server-sequential-independent-await
- **Estimated scope**: 1 file, small

## Problem

Root `beforeLoad` in `app/routes/__root.tsx:13` already resolves `currentUser` for every route. The home loader reuses it:

    // app/routes/index.tsx:125 — exemplar
    loader: async ({ deps, context }) => {
      const data = await loadHomeData({ data: { filter: deps.filter, sort: deps.sort } });
      const currentUser = context.currentUser;

`app/routes/project.list.tsx:27` does not. It awaits `getServerT` first, then `Promise.all([getCurrentUser(), getCategories()])` inside `loadProjectListData`. That is a second `users` SELECT and a waterfall with translations.

    // app/routes/project.list.tsx:26 — current
    .handler(async ({ data: search }) => {
      const t = await getServerT("projectList");
      const [currentUser, categories] = await Promise.all([getCurrentUser(), getCategories()]);

TanStack Router cannot start a child loader before parent `beforeLoad` finishes. Do not remove the root user fetch. The confirmed waste is the duplicate `getCurrentUser()` plus the sequential `getServerT`.

Canonical recipe: race independent awaits with `Promise.all`. Latency becomes the max, not the sum.

## Target

Remove `getCurrentUser()` from `loadProjectListData`. Race `getServerT` with `getCategories` and `fetchProjectsWithSorting` where the project query does not need `t`. Map the user in the route `loader` from `context.currentUser`, same as home.

    // target — server fn (no user)
    .handler(async ({ data: search }) => {
      const [t, categories] = await Promise.all([
        getServerT("projectList"),
        getCategories(),
      ]);

      const initialSort = normalizeSortParam(getSingleSearchParam(search.sort));
      const requestedFilter = getSingleSearchParam(search.filter);
      const initialFilter =
        requestedFilter && categories.some((category) => category.name === requestedFilter)
          ? requestedFilter
          : "all";

      const initialProjects = await fetchProjectsWithSorting(
        initialSort,
        initialFilter === "all" ? undefined : initialFilter,
        100,
      );
      ...
      return { title: t("title"), description: t("description"), initialProjects, ... };
    });

    // target — route loader
    loader: async ({ deps, context }) => {
      const data = await loadProjectListData({ data: { filter: deps.filter, sort: deps.sort } });
      const currentUser = context.currentUser;
      const user = currentUser
        ? {
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar,
            username: currentUser.username,
            role: currentUser.role,
          }
        : null;
      return {
        ...data,
        isLoggedIn: !!currentUser,
        user,
      };
    },

Keep filter validation against `categories` before the project query (same as today). Do not parallelize projects with categories unless you also copy the nested-promise pattern from plan `013`. This plan only removes the duplicate user fetch and races `t` with categories.

## Repo conventions to follow

- Copy the comment and `context.currentUser` mapping from `app/routes/index.tsx:125`.
- Keep `createServerFn` for the data that must not land in the client bundle.
- Remove the unused `getCurrentUser` import from `lib/server/auth` if nothing else in the file uses it.

## Steps

1. Delete `getCurrentUser()` from `loadProjectListData` in `app/routes/project.list.tsx`.
2. `Promise.all` `getServerT` and `getCategories`.
3. Map `context.currentUser` in the route `loader`.
4. Keep the returned `user` / `isLoggedIn` shape so `ProjectListClient` does not change.

## Boundaries

- Do NOT remove root `beforeLoad`.
- Do NOT add dependencies.
- Do NOT change filter/sort search params.
- STOP if `loadProjectListData` has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `server-sequential-independent-await` on this file (or the remaining await is the category-dependent project query). Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/project/list` logged out and logged in. Confirm the navbar still shows the correct auth state. Confirm filter and sort still load projects.
- **Done when**: project list does not call `getCurrentUser()` again, and the UI still receives `isLoggedIn` / `user`.
