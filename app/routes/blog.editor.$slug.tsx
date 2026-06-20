import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import BlogEditorClient from "@/app/blog/editor/blog-editor-client";
import { getPostForEdit } from "@/lib/actions/blog";
import { NOINDEX_META } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/homepage";

async function getUserData(userId: string, email: string): Promise<User | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, username, role")
    .eq("id", userId)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.display_name,
    email,
    avatar: profile.avatar_url || "/vibedev-guest-avatar.png",
    username: profile.username,
    role: profile.role ?? null,
  };
}

export const Route = createFileRoute("/blog/editor/$slug")({
  loader: async ({ params }) => loadBlogEditorEditData({ data: { slug: params.slug } }),
  head: () => ({
    meta: [{ title: "Edit Post | VibeDev ID" }, NOINDEX_META],
  }),
  component: BlogEditorEditRoute,
});

/**
 * Server-only data fetching for the blog edit page. Wrapped in `createServerFn`
 * so the server-only Supabase client never executes (or gets bundled) on the
 * client when the loader re-runs during client-side navigation.
 */
const loadBlogEditorEditData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({ to: "/user/auth", search: { redirectTo: `/blog/editor/${slug}` } });
    }

    const [userData, postResult] = await Promise.all([
      getUserData(user.id, user.email || ""),
      getPostForEdit(slug),
    ]);

    if (!userData) {
      throw redirect({ to: "/user/auth", search: { redirectTo: `/blog/editor/${slug}` } });
    }

    if (!postResult.success || !postResult.data) {
      throw redirect({ to: "/dashboard/posts" });
    }

    return {
      user: userData,
      initialData: postResult.data,
    };
  });

function BlogEditorEditRoute() {
  const { user, initialData } = Route.useLoaderData();

  return <BlogEditorClient user={user} initialData={initialData} mode="edit" />;
}
