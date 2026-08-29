import { fetchProjectsWithSorting, type ProjectCard } from "@/lib/server/project-public";
import type { SortBy } from "@/types/homepage";

/**
 * Homepage project list. Database failures return an empty list so the rest
 * of the landing page still renders instead of the router error screen.
 */
export async function loadHomeProjects(
  sortBy: SortBy,
  category: string | undefined,
): Promise<ProjectCard[]> {
  try {
    return await fetchProjectsWithSorting(sortBy, category, 20);
  } catch (error) {
    console.error(
      "[loadHomeProjects] failed:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}
