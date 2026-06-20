import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  deleteProject as deleteProjectAction,
  editProject as editProjectAction,
  fetchProjectsWithSorting as fetchProjectsWithSortingAction,
  incrementBlogPostViews as incrementBlogPostViewsAction,
} from "@/lib/actions";
import {
  cleanupProjectProvisionalUpload as cleanupProjectProvisionalUploadAction,
  submitProject as submitProjectAction,
} from "@/lib/actions/projects";

/**
 * Submit a new project. Expects a FormData payload containing the project
 * fields plus a `userId` field. Auth + ownership are re-verified server-side
 * inside the underlying action.
 */
export const submitProjectFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("submitProjectFn expects FormData");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const userId = (data.get("userId") as string | null) ?? "";
    return submitProjectAction(data, userId);
  });

/**
 * Edit an existing project. Expects a FormData payload that includes a
 * `projectSlug` field. Ownership is verified server-side.
 */
export const editProjectFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("editProjectFn expects FormData");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const projectSlug = (data.get("projectSlug") as string | null) ?? "";
    return editProjectAction(projectSlug, data);
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .validator(z.object({ projectSlug: z.string().min(1) }))
  .handler(async ({ data }) => {
    return deleteProjectAction(data.projectSlug);
  });

export const cleanupProjectProvisionalUploadFn = createServerFn({ method: "POST" })
  .validator(z.object({ imageKey: z.string().min(1) }))
  .handler(async ({ data }) => {
    return cleanupProjectProvisionalUploadAction(data.imageKey);
  });

export const incrementBlogPostViewsFn = createServerFn({ method: "POST" })
  .validator(z.object({ postId: z.string().min(1), sessionId: z.string().optional() }))
  .handler(async ({ data }) => {
    return incrementBlogPostViewsAction(data.postId, data.sessionId);
  });

/**
 * Fetch projects with sorting/filtering. Used by client-side filter UI, so it
 * must be called through this server-function boundary rather than importing
 * the raw server action (which pulls server-only modules into the client).
 */
export const fetchProjectsWithSortingFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      sortBy: z.enum(["trending", "top", "newest"]).default("newest"),
      category: z.string().optional(),
      limit: z.number().int().positive().max(100).default(20),
    }),
  )
  .handler(async ({ data }) => {
    return fetchProjectsWithSortingAction(data.sortBy, data.category, data.limit);
  });
