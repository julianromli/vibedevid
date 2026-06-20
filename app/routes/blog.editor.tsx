import { createServerFn } from "@tanstack/react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import BlogEditorClient from "@/app/blog/editor/blog-editor-client";
import { NOINDEX_META } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";
import type { User } from "@/types/homepage";

export const Route = createFileRoute("/blog/editor")({
  loader: async () => loadBlogEditorData(),
  head: () => ({
    meta: [{ title: "Blog Editor | VibeDev ID" }, NOINDEX_META],
  }),
  component: BlogEditorRoute,
});

const loadBlogEditorData = createServerFn({ method: "GET" }).handler(async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw redirect({ to: "/user/auth", search: { redirectTo: "/blog/editor" } });
  }

  const userData: User = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    username: currentUser.username,
    role: currentUser.role ?? null,
  };

  if (!userData.username) {
    console.error("[BlogEditor] User profile not found for user:", currentUser.id);
    throw redirect({ to: "/user/auth", search: { redirectTo: "/blog/editor" } });
  }

  return { user: userData };
});

function BlogEditorRoute() {
  const { user } = Route.useLoaderData();

  return <BlogEditorClient user={user} />;
}
