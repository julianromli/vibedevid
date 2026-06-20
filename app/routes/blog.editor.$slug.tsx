import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import BlogEditorClient from "@/app/blog/editor/blog-editor-client";
import { getPostForEdit } from "@/lib/actions/blog";
import { NOINDEX_META } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";
import type { User } from "@/types/homepage";

export const Route = createFileRoute("/blog/editor/$slug")({
  loader: async ({ params }) => loadBlogEditorEditData({ data: { slug: params.slug } }),
  head: () => ({
    meta: [{ title: "Edit Post | VibeDev ID" }, NOINDEX_META],
  }),
  component: BlogEditorEditRoute,
});

const loadBlogEditorEditData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw redirect({ to: "/user/auth", search: { redirectTo: `/blog/editor/${slug}` } });
    }

    const [postResult] = await Promise.all([getPostForEdit(slug)]);

    const userData: User = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      username: currentUser.username,
      role: currentUser.role ?? null,
    };

    if (!userData.username) {
      throw redirect({ to: "/user/auth", search: { redirectTo: `/blog/editor/${slug}` } });
    }

    if (!postResult.success || !postResult.data) {
      throw redirect({ to: "/dashboard/posts" });
    }

    return {
      user: userData,
      initialData: postResult.data,
    } as { user: User; initialData: NonNullable<typeof postResult.data> };
  });

function BlogEditorEditRoute() {
  const { user, initialData } = Route.useLoaderData();

  return <BlogEditorClient user={user} initialData={initialData} mode="edit" />;
}
