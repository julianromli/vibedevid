import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import BlogPageClient from "@/app/blog/blog-page-client";
import { absoluteUrl } from "@/lib/seo/site-url";
import { fetchPublishedPosts } from "@/lib/server/blog-public";
import { getCurrentUser } from "@/lib/server/auth";
import type { User } from "@/types/homepage";

const loadBlogIndexData = createServerFn({ method: "GET" }).handler(async () => {
  const [currentUser, postsData] = await Promise.all([getCurrentUser(), fetchPublishedPosts()]);

  const userData: User | null = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role ?? null,
      }
    : null;

  return {
    isLoggedIn: !!currentUser,
    user: userData,
    posts: postsData || [],
  };
});

export const Route = createFileRoute("/blog/")({
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  loader: async () => loadBlogIndexData(),
  head: () => ({
    meta: [
      { title: "Blog | VibeDev ID" },
      {
        name: "description",
        content:
          "Artikel, tutorial, dan cerita seputar vibe coding, AI, dan pengembangan software dari komunitas VibeDev ID.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/blog") }],
  }),
  component: BlogIndexRoute,
});

function BlogIndexRoute() {
  const data = Route.useLoaderData();

  return <BlogPageClient isLoggedIn={data.isLoggedIn} user={data.user} posts={data.posts} />;
}
