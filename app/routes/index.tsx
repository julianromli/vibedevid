import { asc } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import HomePageClient from "@/app/home-page-client";
import { fetchProjectsWithSorting } from "@/lib/actions";
import { getCategories } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { vibeVideos } from "@/lib/db/schema";
import { getSingleSearchParam, normalizeSortParam } from "@/lib/routes/helpers";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getVideoIconKey } from "@/lib/video-icon-key";
import type { Project, ProjectFilterOption, User, VibeVideo } from "@/types/homepage";

async function getVibeVideos(): Promise<VibeVideo[]> {
  const fallbackVideos: VibeVideo[] = [
    {
      title: "Next.js Tutorial: Full Stack App Development",
      description:
        "Learn to build a full stack web app with Next.js, Prisma, and PostgreSQL from scratch to deployment.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      videoId: "dQw4w9WgXcQ",
      publishedAt: "2024-12-20",
      viewCount: "12.5K",
      iconKey: "code",
    },
    {
      title: "Live Coding: Building Modern Dashboard",
      description:
        "Live coding session to build a modern admin dashboard with React and Tailwind CSS.",
      thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
      videoId: "9bZkp7q19f0",
      publishedAt: "2024-12-15",
      viewCount: "8.3K",
      iconKey: "play",
    },
  ];

  try {
    const db = getDb();
    const data = await db.select().from(vibeVideos).orderBy(asc(vibeVideos.position));

    if (!data || data.length === 0) {
      return fallbackVideos;
    }

    return data.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      videoId: video.videoId,
      publishedAt: video.publishedAt,
      viewCount: video.viewCount ?? "0",
      position: video.position,
      iconKey: getVideoIconKey(video.title, video.description),
    }));
  } catch (err) {
    console.error("[getVibeVideos] failed:", err instanceof Error ? err.message : String(err));
    return fallbackVideos;
  }
}

/**
 * Server-only data fetching for the home route. Wrapped in `createServerFn` so
 * the server-only Supabase clients never execute (or get bundled) on the
 * client when the loader re-runs during client-side navigation.
 */
const loadHomeData = createServerFn({ method: "GET" })
  .validator(
    z.object({
      filter: z.string().optional(),
      sort: z.string().optional(),
    }),
  )
  .handler(async ({ data: search }) => {
    const [categories, initialVibeVideos] = await Promise.all([getCategories(), getVibeVideos()]);

    const categoryOptions: ProjectFilterOption[] = (categories ?? []).map((category) => ({
      value: category.name,
      label: category.display_name,
    }));

    const requestedFilter = getSingleSearchParam(search.filter);
    const initialFilter = categoryOptions.some((category) => category.value === requestedFilter)
      ? (requestedFilter ?? "all")
      : "all";
    const initialSort = normalizeSortParam(getSingleSearchParam(search.sort));

    const { projects: initialProjects } = await fetchProjectsWithSorting(
      initialSort,
      initialFilter === "all" ? undefined : initialFilter,
      20,
    );

    return {
      initialProjects: (initialProjects ?? []) as Project[],
      initialCategories: categoryOptions,
      initialFilter,
      initialSort,
      initialVibeVideos,
    };
  });

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { filter?: string; sort?: string } => ({
    filter: typeof search.filter === "string" ? search.filter : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
  }),
  loaderDeps: ({ search }) => ({ filter: search.filter, sort: search.sort }),
  loader: async ({ deps, context }) => {
    const data = await loadHomeData({ data: { filter: deps.filter, sort: deps.sort } });
    // Reuse the user already resolved in the root `beforeLoad` instead of
    // re-querying it here (saves a `users` SELECT per homepage request).
    const currentUser = context.currentUser;
    const initialUser: User | null = currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          username: currentUser.username,
          role: currentUser.role ?? null,
        }
      : null;

    return {
      ...data,
      initialIsLoggedIn: !!currentUser,
      initialUser,
    };
  },
  // Consolidate `?filter`/`?sort` variants onto the clean homepage URL so
  // crawlers don't treat each combination as a separate duplicate page.
  head: () => ({
    links: [
      { rel: "canonical", href: getSiteUrl() },
      // Preload the LCP hero image (desktop AVIF breakpoint) so the browser
      // fetches it before discovering it in the rendered DOM. Matches the
      // `sizes` used by the hero <picture>.
      {
        rel: "preload",
        as: "image",
        href: "/optimized/hero-vibedevid-showcase-1200.avif",
        type: "image/avif",
        imageSrcSet:
          "/optimized/hero-vibedevid-showcase-640.avif 640w, /optimized/hero-vibedevid-showcase-960.avif 960w, /optimized/hero-vibedevid-showcase-1200.avif 1200w, /optimized/hero-vibedevid-showcase-1600.avif 1600w, /optimized/hero-vibedevid-showcase-2400.avif 2400w",
        imageSizes: "(min-width: 1024px) 1200px, 100vw",
        fetchPriority: "high",
      },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const data = Route.useLoaderData();

  return (
    <HomePageClient
      initialIsLoggedIn={data.initialIsLoggedIn}
      initialUser={data.initialUser}
      initialProjects={data.initialProjects}
      initialCategories={data.initialCategories}
      initialFilter={data.initialFilter}
      initialSort={data.initialSort}
      initialVibeVideos={data.initialVibeVideos}
    />
  );
}
