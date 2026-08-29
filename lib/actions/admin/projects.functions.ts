import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AdminProject } from "@/lib/actions/admin/projects";
import {
  adminDeleteProject as adminDeleteProjectAction,
  adminUpdateProject as adminUpdateProjectAction,
  toggleProjectFeatured as toggleProjectFeaturedAction,
} from "@/lib/actions/admin/projects";
import { ProjectIdSchema } from "@/lib/actions/admin/schemas";

export const adminUpdateProjectFn = createServerFn({ method: "POST" })
  .validator((data: { projectId: number; updates: Partial<AdminProject> }) => data)
  .handler(async ({ data }) => adminUpdateProjectAction(data.projectId, data.updates));

export const adminDeleteProjectFn = createServerFn({ method: "POST" })
  .validator(z.object({ projectId: ProjectIdSchema }))
  .handler(async ({ data }) => adminDeleteProjectAction(data.projectId));

export const toggleProjectFeaturedFn = createServerFn({ method: "POST" })
  .validator(z.object({ projectId: ProjectIdSchema, featured: z.boolean() }))
  .handler(async ({ data }) => toggleProjectFeaturedAction(data.projectId, data.featured));
