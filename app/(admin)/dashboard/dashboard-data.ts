import { getPrivilegedUsers } from "@/lib/actions/admin/admins";
import { getReportedComments } from "@/lib/actions/admin/comments";
import { getAllPosts, getAllTags } from "@/lib/actions/admin/posts";
import { getAllProjects, getProjectCategories } from "@/lib/actions/admin/projects";
import { getAllUsers } from "@/lib/actions/admin/users";
import { getPendingEvents } from "@/lib/actions/events";
import type { DashboardTabValue } from "@/lib/admin/dashboard-tabs";

type ProjectsResult = Awaited<ReturnType<typeof getAllProjects>>;
type CategoriesResult = Awaited<ReturnType<typeof getProjectCategories>>;
type PostsResult = Awaited<ReturnType<typeof getAllPosts>>;
type TagsResult = Awaited<ReturnType<typeof getAllTags>>;
type UsersResult = Awaited<ReturnType<typeof getAllUsers>>;
type ReportsResult = Awaited<ReturnType<typeof getReportedComments>>;
type PendingEventsResult = Awaited<ReturnType<typeof getPendingEvents>>;
type PrivilegedResult = Awaited<ReturnType<typeof getPrivilegedUsers>>;

/**
 * One payload member per board tab. The `kind` discriminator lets the route's
 * panel exhaustively narrow without spreading `any`.
 *
 * `client-fetched` covers overview/analytics — those boards load their own
 * data client-side and receive no server payload.
 */
export type DashboardBoardData =
  | { kind: "client-fetched" }
  | {
      kind: "projects";
      projects: ProjectsResult["projects"];
      totalCount: ProjectsResult["totalCount"];
      error?: ProjectsResult["error"];
      categories: CategoriesResult["categories"];
      page: number;
    }
  | {
      kind: "blog";
      posts: PostsResult["posts"];
      totalCount: PostsResult["totalCount"];
      error?: PostsResult["error"];
      tags: TagsResult["tags"];
      page: number;
    }
  | {
      kind: "users";
      users: UsersResult["users"];
      totalCount: UsersResult["totalCount"];
      error?: UsersResult["error"];
      page: number;
    }
  | {
      kind: "comments";
      reports: ReportsResult["reports"];
      totalCount: ReportsResult["totalCount"];
      error?: ReportsResult["error"];
      page: number;
    }
  | {
      kind: "events-approval";
      events: PendingEventsResult["events"];
      error?: PendingEventsResult["error"];
    }
  | {
      kind: "admin-management";
      result: PrivilegedResult;
    };

export interface DashboardSearchParams {
  search?: string;
  role?: string;
  status?: string;
  page?: string;
  tab?: string;
  category?: string;
}

function parsePage(page?: string): number {
  return page ? Number.parseInt(page, 10) || 1 : 1;
}

/**
 * Fetch the data needed to render a single admin dashboard board, based on
 * the active tab and the current search params. Runs server-side from the
 * route loader.
 */
export async function loadDashboardBoardData(
  tab: DashboardTabValue,
  search: DashboardSearchParams,
): Promise<DashboardBoardData> {
  const page = parsePage(search.page);

  switch (tab) {
    case "projects": {
      const [{ projects, totalCount, error }, { categories }] = await Promise.all([
        getAllProjects(
          {
            status: search.status as "all" | "featured" | "regular" | undefined,
            category: search.category,
            search: search.search,
          },
          page,
          20,
        ),
        getProjectCategories(),
      ]);
      return { kind: "projects", projects, totalCount, error, categories, page };
    }
    case "blog": {
      const [{ posts, totalCount, error }, { tags }] = await Promise.all([
        getAllPosts(
          {
            status: search.status as "all" | "draft" | "published" | "archived" | undefined,
            search: search.search,
          },
          page,
          20,
        ),
        getAllTags(),
      ]);
      return { kind: "blog", posts, totalCount, error, tags, page };
    }
    case "users": {
      const { users, totalCount, error } = await getAllUsers(
        {
          search: search.search,
          role: search.role as "all" | "admin" | "moderator" | "user" | undefined,
          status: search.status as "all" | "active" | "suspended" | undefined,
        },
        page,
        20,
      );
      return { kind: "users", users, totalCount, error, page };
    }
    case "comments": {
      const { reports, totalCount, error } = await getReportedComments(
        { status: search.status as "all" | "pending" | "reviewed" | "dismissed" | undefined },
        page,
        20,
      );
      return { kind: "comments", reports, totalCount, error, page };
    }
    case "events-approval": {
      const { events, error } = await getPendingEvents();
      return { kind: "events-approval", events, error };
    }
    case "admin-management": {
      const result = await getPrivilegedUsers();
      return { kind: "admin-management", result };
    }
    default:
      return { kind: "client-fetched" };
  }
}
