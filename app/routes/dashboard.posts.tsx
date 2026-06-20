import { createFileRoute } from "@tanstack/react-router";
import { PostDashboardClient } from "@/app/dashboard/posts/post-dashboard-client";
import { NOINDEX_META } from "@/lib/seo/site-url";

export const Route = createFileRoute("/dashboard/posts")({
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
  return <PostDashboardClient />;
}
