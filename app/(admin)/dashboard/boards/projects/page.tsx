import type { getAllProjects, getProjectCategories } from "@/lib/actions/admin/projects";
import { ProjectFilters } from "./components/project-filters";
import { ProjectsTable } from "./components/projects-table";

type ProjectsResult = Awaited<ReturnType<typeof getAllProjects>>;
type CategoriesResult = Awaited<ReturnType<typeof getProjectCategories>>;

export interface ProjectsBoardProps {
  projects: ProjectsResult["projects"];
  totalCount: ProjectsResult["totalCount"];
  error?: ProjectsResult["error"];
  categories: CategoriesResult["categories"];
  page: number;
}

export default function ProjectsPage({
  projects,
  totalCount,
  error,
  categories,
  page,
}: ProjectsBoardProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load projects</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProjectFilters categories={categories} />
      <ProjectsTable projects={projects} totalCount={totalCount} currentPage={page} />
    </div>
  );
}
