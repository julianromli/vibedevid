import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PostDashboardClient } from "@/app/dashboard/posts/post-dashboard-client";
import { getAuthorPosts } from "@/lib/actions/blog";
import { NOINDEX_META } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";

const loadDashboardPosts = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw redirect({ to: "/user/auth", search: { redirectTo: "/dashboard/posts" } });
  }

  const result = await getAuthorPosts(1, "all");
  return result.success ? result.data : [];
});

export const Route = createFileRoute("/dashboard/posts")({
  loader: async () => loadDashboardPosts(),
  head: () => ({
    meta: [
      { title: "Blog Dashboard | VibeDev ID" },
      { name: "description", content: "Manage your community blog posts" },
      NOINDEX_META,
    ],
  }),
  component: DashboardPostsRoute,
});

function DashboardPostsRoute() {
  const initialPosts = Route.useLoaderData();

  return <PostDashboardClient initialPosts={initialPosts} />;
}
