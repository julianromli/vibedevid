import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import BlogPostData, { type BlogPostDataProps } from "@/app/blog/[slug]/blog-post-data";
import { getComments } from "@/lib/actions/comments";
import { absoluteUrl } from "@/lib/seo/site-url";
import { getCurrentUser } from "@/lib/server/auth";
import { fetchPostDetailBySlug } from "@/lib/server/blog-public";

const DEFAULT_OG_IMAGE =
  "https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNWvWOsz96heqapobuABSCvEXgf9wT2xdRkGM0";

const loadBlogPostData = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }): Promise<BlogPostDataProps & { slug: string }> => {
    const currentUser = await getCurrentUser();

    let userData: BlogPostDataProps["userData"] = null;
    let commentUser: BlogPostDataProps["commentUser"] = null;
    if (currentUser) {
      userData = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role ?? null,
      };
      commentUser = {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar_url || undefined,
      };
    }

    const detail = await fetchPostDetailBySlug(slug);
    if (!detail) {
      throw notFound();
    }

    const { comments: initialComments } = await getComments("post", detail.post.id);

    return {
      post: detail.post,
      viewCount: detail.viewCount,
      initialComments,
      isLoggedIn: !!currentUser,
      userData,
      commentUser,
      slug,
    };
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }): Promise<BlogPostDataProps & { slug: string }> => {
    return loadBlogPostData({ data: { slug: params.slug } });
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return {
        meta: [
          { title: "Post Not Found" },
          { name: "description", content: "The blog post you are looking for does not exist." },
        ],
      };
    }

    const postUrl = absoluteUrl(`/blog/${loaderData.slug}`);
    const ogImage = post.cover_image || DEFAULT_OG_IMAGE;
    const author = post.author as { display_name: string } | null;
    const authorName = author?.display_name || "VibeDev ID";
    const tags = post.tags as Array<{ post_tags: { name: string } | null }> | null;
    const postTagsList =
      tags?.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name)) ?? [];
    const description = post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`;

    return {
      meta: [
        { title: post.title },
        { name: "description", content: description },
        ...(postTagsList.length > 0
          ? [{ name: "keywords", content: postTagsList.join(", ") }]
          : []),
        { name: "author", content: authorName },
        { property: "og:title", content: post.title },
        { property: "og:description", content: description },
        { property: "og:url", content: postUrl },
        { property: "og:site_name", content: "VibeDev ID" },
        { property: "og:locale", content: "id_ID" },
        { property: "og:type", content: "article" },
        ...(post.published_at
          ? [{ property: "article:published_time", content: post.published_at }]
          : []),
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:site", content: "@vibedevid" },
        { name: "twitter:creator", content: "@vibedevid" },
      ],
      links: [{ rel: "canonical", href: postUrl }],
    };
  },
  component: BlogPostRoute,
});

function BlogPostRoute() {
  const { post, viewCount, initialComments, isLoggedIn, userData, commentUser } =
    Route.useLoaderData();

  return (
    <BlogPostData
      post={post}
      viewCount={viewCount}
      initialComments={initialComments}
      isLoggedIn={isLoggedIn}
      userData={userData}
      commentUser={commentUser}
    />
  );
}
