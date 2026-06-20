import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ProjectListClient } from "@/app/project/list/project-list-client";
import { Footer } from "@/components/ui/footer";
import { ScrollReveal } from "@/components/ui/motion-wrapper";
import { Navbar } from "@/components/ui/navbar";
import { fetchProjectsWithSorting } from "@/lib/actions";
import { getCategories } from "@/lib/categories";
import { getServerT, getSingleSearchParam, normalizeSortParam } from "@/lib/routes/helpers";
import { absoluteUrl } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";

/**
 * Server-only data fetching for the project list. Wrapped in `createServerFn`
 * so the server-only Supabase clients / translations never execute (or get
 * bundled) on the client when the loader re-runs during client-side navigation.
 */
const loadProjectListData = createServerFn({ method: "GET" })
  .validator(
    z.object({
      filter: z.string().optional(),
      sort: z.string().optional(),
    }),
  )
  .handler(async ({ data: search }) => {
    const t = await getServerT("projectList");
    const [currentUser, categories] = await Promise.all([getCurrentUser(), getCategories()]);

    const initialSort = normalizeSortParam(getSingleSearchParam(search.sort));
    const requestedFilter = getSingleSearchParam(search.filter);
    const initialFilter =
      requestedFilter && categories.some((category) => category.name === requestedFilter)
        ? requestedFilter
        : "all";

    const { projects: initialProjects } = await fetchProjectsWithSorting(
      initialSort,
      initialFilter === "all" ? undefined : initialFilter,
      100,
    );

    const filterOptions = categories.map((cat) => ({
      value: cat.name,
      label: cat.display_name,
    }));
    const normalizedProjects = (initialProjects ?? []).map((project) => ({
      ...project,
      image: project.image ?? "/vibedev-guest-avatar.png",
    }));

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
      title: t("title"),
      description: t("description"),
      initialProjects: normalizedProjects,
      initialFilter,
      initialSort,
      filterOptions,
      isLoggedIn: !!currentUser,
      user,
    };
  });

export const Route = createFileRoute("/project/list")({
  validateSearch: (search: Record<string, unknown>): { filter?: string; sort?: string } => ({
    filter: typeof search.filter === "string" ? search.filter : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
  }),
  loaderDeps: ({ search }) => ({ filter: search.filter, sort: search.sort }),
  loader: async ({ deps }) => {
    return loadProjectListData({ data: { filter: deps.filter, sort: deps.sort } });
  },
  // Self-referencing canonical to the clean list URL so `?filter`/`?sort`
  // variants consolidate onto a single indexable page.
  head: () => ({
    links: [{ rel: "canonical", href: absoluteUrl("/project/list") }],
  }),
  component: ProjectListRoute,
});

function ProjectListRoute() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

        <Navbar showNavigation={true} isLoggedIn={data.isLoggedIn} user={data.user ?? undefined} />

        <section className="relative bg-transparent py-12 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="mb-12 text-center">
              <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight lg:text-5xl">
                {data.title}
              </h1>
              <p className="mx-auto max-w-2xl text-muted-foreground text-xl">{data.description}</p>
            </ScrollReveal>

            <ProjectListClient
              initialProjects={data.initialProjects}
              initialFilter={data.initialFilter}
              initialSort={data.initialSort}
              filterOptions={data.filterOptions}
            />
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
