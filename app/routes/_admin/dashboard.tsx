import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { z } from "zod";
import AdminManagementPage from "@/app/(admin)/dashboard/boards/admin-management/page";
import Analytics from "@/app/(admin)/dashboard/boards/analytics";
import BlogPage from "@/app/(admin)/dashboard/boards/blog/page";
import CommentsPage from "@/app/(admin)/dashboard/boards/comments/page";
import EventsApproval from "@/app/(admin)/dashboard/boards/events-approval/page";
import Overview from "@/app/(admin)/dashboard/boards/overview";
import ProjectsPage from "@/app/(admin)/dashboard/boards/projects/page";
import UsersPage from "@/app/(admin)/dashboard/boards/users/page";
import {
  DashboardContent,
  DashboardContentFallback,
} from "@/app/(admin)/dashboard/components/dashboard-tabs";
import {
  loadDashboardBoardData,
  type DashboardBoardData,
} from "@/app/(admin)/dashboard/dashboard-data";
import { Header } from "@/components/admin-panel/header";
import { type DashboardTabValue, resolveDashboardTab } from "@/lib/admin/dashboard-tabs";

const TAB_TITLES: Record<DashboardTabValue, string> = {
  overview: "Overview",
  analytics: "Analytics",
  "events-approval": "Events",
  projects: "Projects",
  blog: "Blog",
  users: "Users",
  "admin-management": "Admin management",
  comments: "Comments",
};

function DashboardTabPanel({
  tab,
  boardData,
}: {
  tab: DashboardTabValue;
  boardData: DashboardBoardData;
}) {
  switch (tab) {
    case "overview":
      return <Overview />;
    case "analytics":
      return <Analytics />;
    case "events-approval":
      if (boardData.kind !== "events-approval") return <Overview />;
      return <EventsApproval events={boardData.events} error={boardData.error} />;
    case "projects":
      if (boardData.kind !== "projects") return <Overview />;
      return (
        <ProjectsPage
          projects={boardData.projects}
          totalCount={boardData.totalCount}
          error={boardData.error}
          categories={boardData.categories}
          page={boardData.page}
        />
      );
    case "blog":
      if (boardData.kind !== "blog") return <Overview />;
      return (
        <BlogPage
          posts={boardData.posts}
          totalCount={boardData.totalCount}
          error={boardData.error}
          tags={boardData.tags}
          page={boardData.page}
        />
      );
    case "users":
      if (boardData.kind !== "users") return <Overview />;
      return (
        <UsersPage
          users={boardData.users}
          totalCount={boardData.totalCount}
          error={boardData.error}
          page={boardData.page}
        />
      );
    case "admin-management":
      if (boardData.kind !== "admin-management") return <Overview />;
      return <AdminManagementPage result={boardData.result} />;
    case "comments":
      if (boardData.kind !== "comments") return <Overview />;
      return (
        <CommentsPage
          reports={boardData.reports}
          totalCount={boardData.totalCount}
          error={boardData.error}
          page={boardData.page}
        />
      );
    default:
      return <Overview />;
  }
}

const dashboardSearchSchema = z.object({
  tab: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  role: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
  page: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
});

type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

/**
 * Server-only admin board data fetching. Wrapped in `createServerFn` so the
 * server-only data loaders never execute (or get bundled) on the client when
 * the loader re-runs during client-side navigation.
 */
const loadAdminDashboardData = createServerFn({ method: "GET" })
  .validator(dashboardSearchSchema)
  .handler(async ({ data: search }) => {
    const activeTab = resolveDashboardTab(search.tab);
    const boardData = await loadDashboardBoardData(activeTab, search);
    return { activeTab, boardData };
  });

export const Route = createFileRoute("/_admin/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch =>
    dashboardSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => loadAdminDashboardData({ data: deps.search }),
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const { activeTab, boardData } = Route.useLoaderData();

  return (
    <>
      <Header />

      <div className="space-y-4 p-4" suppressHydrationWarning>
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{TAB_TITLES[activeTab]}</h1>
        </div>
        <Suspense fallback={<DashboardContentFallback />}>
          <DashboardContent>
            <DashboardTabPanel tab={activeTab} boardData={boardData} />
          </DashboardContent>
        </Suspense>
      </div>
    </>
  );
}
