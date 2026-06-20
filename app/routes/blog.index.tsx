import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import BlogPageClient from "@/app/blog/blog-page-client";
import { fetchPublishedPosts } from "@/lib/server/blog-public";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/homepage";

/**
 * Server-only data fetching for the blog index. Wrapped in `createServerFn` so
 * the cookie-aware Supabase server client never executes (or gets bundled) on
 * the client when the loader re-runs during client-side navigation.
 */
const loadBlogIndexData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await createClient();
  const postsDataPromise = fetchPublishedPosts();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData: User | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, username, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      userData = {
        id: profile.id,
        name: profile.display_name,
        email: user.email || "",
        avatar: profile.avatar_url || "/vibedev-guest-avatar.png",
        username: profile.username,
        role: profile.role ?? null,
      };
    }
  }

  const postsData = await postsDataPromise;

  return {
    isLoggedIn: !!user,
    user: userData,
    posts: postsData || [],
  };
});

export const Route = createFileRoute("/blog/")({
  // Mirror the previous server-side 60s cache: keep loader data fresh for 60s
  // before revalidating, and retain it in memory for 5 minutes.
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  loader: async () => loadBlogIndexData(),
  component: BlogIndexRoute,
});

function BlogIndexRoute() {
  const data = Route.useLoaderData();

  return <BlogPageClient isLoggedIn={data.isLoggedIn} user={data.user} posts={data.posts} />;
}
