import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminPost } from "@/lib/actions/admin/posts";
import {
  adminDeletePost as adminDeletePostAction,
  adminUpdatePost as adminUpdatePostAction,
  createTag as createTagAction,
  deleteTag as deleteTagAction,
  togglePostFeatured as togglePostFeaturedAction,
} from "@/lib/actions/admin/posts";
import { PostIdSchema, TagIdSchema, TagNameSchema } from "@/lib/actions/admin/schemas";

export const adminUpdatePostFn = createServerFn({ method: "POST" })
  .validator((data: { postId: string; updates: Partial<AdminPost> }) => data)
  .handler(async ({ data }) => adminUpdatePostAction(data.postId, data.updates));

export const adminDeletePostFn = createServerFn({ method: "POST" })
  .validator(z.object({ postId: PostIdSchema }))
  .handler(async ({ data }) => adminDeletePostAction(data.postId));

export const togglePostFeaturedFn = createServerFn({ method: "POST" })
  .validator(z.object({ postId: PostIdSchema, featured: z.boolean() }))
  .handler(async ({ data }) => togglePostFeaturedAction(data.postId, data.featured));

export const createTagFn = createServerFn({ method: "POST" })
  .validator(z.object({ name: TagNameSchema }))
  .handler(async ({ data }) => createTagAction(data.name));

export const deleteTagFn = createServerFn({ method: "POST" })
  .validator(z.object({ tagId: TagIdSchema }))
  .handler(async ({ data }) => deleteTagAction(data.tagId));
