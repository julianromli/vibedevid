import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createComment as createCommentAction,
  getComments as getCommentsAction,
  reportComment as reportCommentAction,
} from "@/lib/actions/comments";
import type { CommentEntityType } from "@/types/comments";

const entityTypeSchema = z.enum(["post", "project"]);

const createCommentSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
  content: z.string().min(2).max(2000),
  guestName: z.string().trim().min(2).max(50).optional(),
});

const getCommentsSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
});

const reportCommentSchema = z.object({
  commentId: z.string().min(1),
  reason: z.string().min(1).max(200),
});

export const createCommentFn = createServerFn({ method: "POST" })
  .validator(createCommentSchema)
  .handler(async ({ data }) => {
    return createCommentAction({
      entityType: data.entityType as CommentEntityType,
      entityId: data.entityId,
      content: data.content,
      guestName: data.guestName,
    });
  });

export const getCommentsFn = createServerFn({ method: "GET" })
  .validator(getCommentsSchema)
  .handler(async ({ data }) => {
    return getCommentsAction(data.entityType as CommentEntityType, data.entityId);
  });

export const reportCommentFn = createServerFn({ method: "POST" })
  .validator(reportCommentSchema)
  .handler(async ({ data }) => {
    return reportCommentAction(data.commentId, data.reason);
  });
