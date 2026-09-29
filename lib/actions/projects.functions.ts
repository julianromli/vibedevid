import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  cleanupProjectProvisionalUpload as cleanupProjectProvisionalUploadAction,
  deleteProject as deleteProjectAction,
  editProject as editProjectAction,
  submitProject as submitProjectAction,
} from "@/lib/actions/projects";
import { PROJECT_PAGE_SIZE } from "@/lib/project-page-cursor";
import { fetchProjectPage as fetchProjectPageAction } from "@/lib/server/project-public";
import { recordProjectView as recordProjectViewAction } from "@/lib/server/project-views";

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
      authorUsername: z.string().min(1).max(32).optional(),
      limit: z.number().int().positive().max(PROJECT_PAGE_SIZE).default(PROJECT_PAGE_SIZE),
      cursor: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const page = await fetchProjectPageAction({
        sortBy: data.sortBy,
        category: data.category,
        authorUsername: data.authorUsername,
        limit: data.limit,
        cursor: data.cursor,
      });
      return { projects: page.projects, nextCursor: page.nextCursor, error: null } as const;
    } catch (error) {
      console.error("fetchProjectsWithSortingFn failed:", error);
      return { projects: [], nextCursor: null, error: "Failed to fetch projects" } as const;
    }
  });

export const recordProjectViewFn = createServerFn({ method: "POST" })
  .validator(z.object({ slug: z.string().min(1).max(120), sessionId: z.string().min(8).max(80) }))
  .handler(async ({ data }) => {
    await recordProjectViewAction(data.slug, data.sessionId);
    return { ok: true as const };
  });
