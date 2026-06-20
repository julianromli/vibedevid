import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createBlogPost,
  deleteBlogPost,
  getAuthorPosts,
  getTags,
  updateBlogPost,
} from "@/lib/actions/blog";

const postStatusSchema = z.enum(["published", "draft", "archived", "all"]);

const getAuthorPostsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  status: postStatusSchema.optional().default("all"),
});

export const getAuthorPostsFn = createServerFn({ method: "GET" })
  .validator(getAuthorPostsSchema)
  .handler(async ({ data: { page, status } }) => {
    return getAuthorPosts(page, status);
  });

export const deleteBlogPostFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data: { id } }) => {
    return deleteBlogPost(id);
  });

const blogPostPayloadSchema = z.object({
  title: z.string().min(1),
  content: z.union([z.record(z.string(), z.unknown()), z.string()]),
  excerpt: z.string().optional(),
  cover_image: z.string().optional(),
  status: z.enum(["published", "draft"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const createBlogPostFn = createServerFn({ method: "POST" })
  .validator(blogPostPayloadSchema)
  .handler(async ({ data }) => {
    return createBlogPost(data);
  });

export const updateBlogPostFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      data: blogPostPayloadSchema
        .extend({ status: z.enum(["published", "draft", "archived"]).optional() })
        .partial(),
    }),
  )
  .handler(async ({ data: { id, data } }) => {
    return updateBlogPost(id, data);
  });

export const getTagsFn = createServerFn({ method: "GET" })
  .validator(z.object({ query: z.string().optional().default("") }))
  .handler(async ({ data: { query } }) => {
    return getTags(query);
  });
