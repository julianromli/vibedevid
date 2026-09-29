import { PROJECT_PAGE_SIZE } from "@/lib/project-page-cursor";
import { fetchProjectPage, type ProjectCard } from "@/lib/server/project-public";
import type { SortBy } from "@/types/homepage";

export interface HomeProjectPage {
  projects: ProjectCard[];
  nextCursor: string | null;
  error: string | null;
}

/**
 * Homepage project list. Database failures return an empty list so the rest
 * of the landing page still renders instead of the router error screen.
 */
export async function loadHomeProjects(
  sortBy: SortBy,
  category: string | undefined,
): Promise<HomeProjectPage> {
  try {
    const page = await fetchProjectPage({ sortBy, category, limit: PROJECT_PAGE_SIZE });
    return { ...page, error: null };
  } catch (error) {
    console.error(
      "[loadHomeProjects] failed:",
      error instanceof Error ? error.message : String(error),
    );
    return { projects: [], nextCursor: null, error: "Could not load projects" };
  }
}
